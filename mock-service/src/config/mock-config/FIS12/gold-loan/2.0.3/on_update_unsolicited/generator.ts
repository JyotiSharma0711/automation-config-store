export async function onUpdateUnsolicitedDefaultGenerator(existingPayload: any, sessionData: any) {
  // Update context timestamp
  if (existingPayload.context) {
    existingPayload.context.timestamp = new Date().toISOString();
  }
  
  // Update transaction_id from session data
  if (sessionData.transaction_id && existingPayload.context) {
    existingPayload.context.transaction_id = sessionData.transaction_id;
  }
  
  // Generate new message_id for unsolicited update
  if (existingPayload.context) {
    existingPayload.context.message_id = generateUUID();
  }

  // Helper function to generate UUID v4
  function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }
  
  // Load order from session data
  if (existingPayload.message) {
    const order = existingPayload.message.order || (existingPayload.message.order = {});

    // Map order.id from session data (carry-forward from confirm)
    if (sessionData.order_id) {
      order.id = sessionData.order_id;
    }

    // Map provider.id from session data (carry-forward from confirm)
    if (sessionData.selected_provider?.id && order.provider) {
      order.provider.id = sessionData.selected_provider.id;
    }

    // Map item.id from session data (carry-forward from confirm)
    const selectedItem = sessionData.item || (Array.isArray(sessionData.items) ? sessionData.items[0] : undefined);
    if (selectedItem?.id && order.items?.[0]) {
      order.items[0].id = selectedItem.id;
    }

    // Map quote.id from session data (carry-forward from confirm)
    if (sessionData.quote_id && order.quote) {
      order.quote.id = sessionData.quote_id;
    }
  }

  // Helper to upsert a breakup line
  function upsertBreakup(order: any, title: string, value: string, currency: string = 'INR') {
    order.quote = order.quote || { price: { currency: 'INR', value: '0' }, breakup: [] };
    order.quote.breakup = Array.isArray(order.quote.breakup) ? order.quote.breakup : [];
    const idx = order.quote.breakup.findIndex((b: any) => (b.title || '').toUpperCase() === title.toUpperCase());
    const row = { title, price: { value, currency } };
    if (idx >= 0) order.quote.breakup[idx] = row; else order.quote.breakup.push(row);
  }

  // Helper to generate time range based on context timestamp
  function generateTimeRangeFromContext(contextTimestamp: string) {
    const contextDate = new Date(contextTimestamp);
    const year = contextDate.getUTCFullYear();
    const month = contextDate.getUTCMonth();
    
    // Create start of month
    const start = new Date(Date.UTC(year, month, 1, 0, 0, 0, 0));
    // Create end of month
    const end = new Date(Date.UTC(year, month + 1, 0, 23, 59, 59, 999));
    
    return {
      start: start.toISOString(),
      end: end.toISOString()
    };
  }

  // Helper to update payment status for specific installments
  function updatePaymentStatus(payments: any[], status: string, count?: number) {
    if (!Array.isArray(payments)) return;
    
    let updatedCount = 0;
    payments.forEach(payment => {
      if (payment.time?.label === 'INSTALLMENT' && payment.type === 'POST_FULFILLMENT') {
        if (count === undefined || updatedCount < count) {
          payment.status = status;
          updatedCount++;
        }
      }
    });
  }

  // Helper to mark unpaid installments as DEFERRED for foreclosure
  function updateForeclosurePaymentStatus(payments: any[]) {
    if (!Array.isArray(payments)) return;
    
    payments.forEach(payment => {
      if (payment.time?.label === 'INSTALLMENT' && payment.type === 'POST_FULFILLMENT') {
        // Keep already PAID installments as PAID, change others to DEFERRED
        if (payment.status !== 'PAID') {
          payment.status = 'DEFERRED';
        }
      }
    });
  }

  // Helper to update payment status for missed EMI (specific installment)
  function updateMissedEMIStatus(payments: any[], contextTimestamp: string) {
    if (!Array.isArray(payments)) return;
    
    const contextDate = new Date(contextTimestamp);
    const contextMonth = contextDate.getUTCMonth();
    const contextYear = contextDate.getUTCFullYear();
    
    // Find the installment that matches the current month and mark it as PAID
    payments.forEach(payment => {
      if (payment.time?.label === 'INSTALLMENT' && payment.type === 'POST_FULFILLMENT' && payment.time?.range?.start) {
        const paymentDate = new Date(payment.time.range.start);
        const paymentMonth = paymentDate.getUTCMonth();
        const paymentYear = paymentDate.getUTCFullYear();
        
        if (paymentMonth === contextMonth && paymentYear === contextYear) {
          payment.status = 'PAID';
        }
      }
    });
  }

  // Helper to update payment status for pre part payment (some PAID, some DEFERRED)
  function updatePrePartPaymentStatus(payments: any[], contextTimestamp: string) {
    if (!Array.isArray(payments)) return;
    
    const contextDate = new Date(contextTimestamp);
    const contextMonth = contextDate.getUTCMonth();
    const contextYear = contextDate.getUTCFullYear();
    
    let paidCount = 0;
    let deferredCount = 0;
    
    payments.forEach(payment => {
      if (payment.time?.label === 'INSTALLMENT' && payment.type === 'POST_FULFILLMENT' && payment.time?.range?.start) {
        const paymentDate = new Date(payment.time.range.start);
        const paymentMonth = paymentDate.getUTCMonth();
        const paymentYear = paymentDate.getUTCFullYear();
        
        // Mark current and next 2 installments as PAID
        if (paymentMonth >= contextMonth && paymentMonth <= contextMonth + 2 && paymentYear === contextYear && paidCount < 3) {
          payment.status = 'PAID';
          paidCount++;
        }
        // Mark next 2 installments as DEFERRED
        else if (paymentMonth > contextMonth + 2 && paymentMonth <= contextMonth + 4 && paymentYear === contextYear && deferredCount < 2) {
          payment.status = 'DEFERRED';
          deferredCount++;
        }
      }
    });
  }

  // Branch by update label
  const orderRef = existingPayload.message?.order || {};
  const label = sessionData.update_label
    || orderRef?.payments?.[0]?.time?.label
    || sessionData.user_inputs?.foreclosure_amount && 'FORECLOSURE'
    || sessionData.user_inputs?.missed_emi_amount && 'MISSED_EMI_PAYMENT'
    || sessionData.user_inputs?.part_payment_amount && 'PRE_PART_PAYMENT'
    || 'FORECLOSURE';

  // Ensure payments structure exists
  orderRef.payments = orderRef.payments || [{}];
  const firstPayment = orderRef.payments[0];
  firstPayment.time = firstPayment.time || {};
  firstPayment.time.label = label;

  if (label === 'MISSED_EMI_PAYMENT') {
    // Set payment params for missed EMI (matching on_confirm installment amount)
    firstPayment.params = firstPayment.params || {};
    firstPayment.params.amount = "46360"; // Matches INSTALLMENT_AMOUNT from on_confirm
    firstPayment.params.currency = "INR";
    
    // Set time range based on context timestamp
    const contextTimestamp = existingPayload.context?.timestamp || new Date().toISOString();
    firstPayment.time.range = generateTimeRangeFromContext(contextTimestamp);
    
    // Mark the specific delayed installment as PAID (based on current month)
    updateMissedEMIStatus(orderRef.payments, contextTimestamp);
    
    // Set payment URL

    const transactionId = existingPayload.context?.transaction_id || sessionData.transaction_id;
    firstPayment.url = `${process.env.FORM_SERVICE}/forms/${sessionData.domain}/payment_url_form?session_id=${sessionData.session_id}&flow_id=${sessionData.flow_id}&transaction_id=${transactionId}&direct=true`;
    console.log("Payment URL for MISSED_EMI_PAYMENT:", firstPayment.url);
  }

  if (label === 'FORECLOSURE') {
    // Add foreclosure charges to quote.breakup
    upsertBreakup(orderRef, 'FORCLOSUER_CHARGES', '9536');
    
    // Calculate foreclosure amount: Outstanding Principal + Outstanding Interest + Foreclosure Charges
    // From on_update_unsolicited default.yaml: OUTSTANDING_PRINCIPAL=139080, OUTSTANDING_INTEREST=0, FORCLOSUER_CHARGES=9536
    const outstandingPrincipal = orderRef.quote?.breakup?.find((b: any) => b.title === 'OUTSTANDING_PRINCIPAL')?.price?.value || '139080';
    const outstandingInterest = orderRef.quote?.breakup?.find((b: any) => b.title === 'OUTSTANDING_INTEREST')?.price?.value || '0';
    const foreclosureCharges = '9536';
    const foreclosureAmount = String(parseInt(outstandingPrincipal) + parseInt(outstandingInterest) + parseInt(foreclosureCharges));
    
    // Set payment params for foreclosure
    firstPayment.params = firstPayment.params || {};
    firstPayment.params.amount = foreclosureAmount; // Outstanding principal + interest + charges
    firstPayment.params.currency = "INR";
    
    // Mark unpaid installments as DEFERRED (already paid ones stay PAID)
    updateForeclosurePaymentStatus(orderRef.payments);
    
    // Remove time range for foreclosure
    if (firstPayment.time.range) delete firstPayment.time.range;
    
    // Set payment URL
    const transactionId = existingPayload.context?.transaction_id || sessionData.transaction_id;
    firstPayment.url = `${process.env.FORM_SERVICE}/forms/${sessionData.domain}/payment_url_form?session_id=${sessionData.session_id}&flow_id=${sessionData.flow_id}&transaction_id=${transactionId}&direct=true`;
    console.log("Payment URL for FORECLOSURE:", firstPayment.url);
  }
  
  if (label === 'PRE_PART_PAYMENT') {
    // Add pre payment charge to quote.breakup
    upsertBreakup(orderRef, 'PRE_PAYMENT_CHARGE', '4500');
    
    // Set payment params for pre part payment (installment amount + pre payment charge)
    firstPayment.params = firstPayment.params || {};
    firstPayment.params.amount = "50860"; // 46360 (installment) + 4500 (pre payment charge)
    firstPayment.params.currency = "INR";
    
    // Update payment statuses: some PAID, some DEFERRED
    const contextTimestamp = existingPayload.context?.timestamp || new Date().toISOString();
    updatePrePartPaymentStatus(orderRef.payments, contextTimestamp);
    
    // Remove time range for pre part payment
    if (firstPayment.time.range) delete firstPayment.time.range;
    
    // Set payment URL
    const refId = sessionData.message_id || orderRef.id || 'b5487595-42c3-4e20-bd43-ae21400f60f0';
    firstPayment.url = `https://pg.icici.com/?amount=50860&ref_id=${encodeURIComponent(refId)}`;
  }
  
  return existingPayload;
}
