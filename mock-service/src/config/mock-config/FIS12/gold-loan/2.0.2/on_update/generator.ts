/**
 * On Update Generator for FIS12
 * 
 * Logic:
 * 1. Update context with current timestamp
 * 2. Update transaction_id and message_id from session data
 * 3. Generate or update quote.id, provider.id, order.id, and item.id with gold_loan_ prefix
 * 4. Handle three payment types: MISSED_EMI_PAYMENT, FORECLOSURE, PRE_PART_PAYMENT
 * 5. Set time ranges based on context timestamp for MISSED_EMI_PAYMENT
 */

import { randomUUID } from 'crypto';

export async function onUpdateDefaultGenerator(existingPayload: any, sessionData: any) {
  // Update context timestamp
  if (existingPayload.context) {
    existingPayload.context.timestamp = new Date().toISOString();
  }
  
  // Update transaction_id from session data
  if (sessionData.transaction_id && existingPayload.context) {
    existingPayload.context.transaction_id = sessionData.transaction_id;
  }
  
  // Update message_id from session data
  if (sessionData.message_id && existingPayload.context) {
    existingPayload.context.message_id = sessionData.message_id;
  }
  
  // Load order from session data
  if (existingPayload.message) {
    const order = existingPayload.message.order || (existingPayload.message.order = {});

    // Carry forward payments (with installment ranges) from on_init saved order
    if (sessionData.order?.payments?.length) {
      order.payments = sessionData.order.payments;
      console.log("Carried forward payments from session (installment ranges preserved)");
    }

    // Generate or update order.id with gold_loan_ prefix
    if (sessionData.order_id) {
      order.id = sessionData.order_id;
      console.log("Updated order.id from session:", sessionData.order_id);
    } else if (!order.id || 
               order.id === "LOAN_LEAD_ID_OR_SIMILAR_ORDER_ID" ||
               order.id.startsWith("LOAN_LEAD_ID")) {
      order.id = `gold_loan_${randomUUID()}`;
      console.log("Generated order.id:", order.id);
    }

    // Generate or update provider.id with gold_loan_ prefix
    if (order.provider) {
      if (sessionData.selected_provider?.id) {
      order.provider.id = sessionData.selected_provider.id;
        console.log("Updated provider.id from session:", sessionData.selected_provider.id);
      } else if (!order.provider.id || 
                 order.provider.id === "PROVIDER_ID" ||
                 order.provider.id.startsWith("PROVIDER_ID")) {
        order.provider.id = `gold_loan_${randomUUID()}`;
        console.log("Generated provider.id:", order.provider.id);
      }
    }

    // Generate or update item.id with gold_loan_ prefix
    const selectedItem = sessionData.item || (Array.isArray(sessionData.items) ? sessionData.items[0] : undefined);
    if (order.items?.[0]) {
      if (selectedItem?.id) {
      order.items[0].id = selectedItem.id;
        console.log("Updated item.id from session:", selectedItem.id);
      } else if (!order.items[0].id || 
                 order.items[0].id === "ITEM_ID_GOLD_LOAN_1" ||
                 order.items[0].id === "ITEM_ID_GOLD_LOAN_2" ||
                 order.items[0].id.startsWith("ITEM_ID_GOLD_LOAN")) {
        order.items[0].id = `gold_loan_${randomUUID()}`;
        console.log("Generated item.id:", order.items[0].id);
      }
    }

    // Generate or update quote.id with gold_loan_ prefix
    if (order.quote) {
      // Try multiple sources: quote_id, order.quote.id from saved order, or generate new
      const quoteId = sessionData.quote_id || sessionData.order?.quote?.id || sessionData.quote?.id;
      if (quoteId) {
        order.quote.id = quoteId;
        console.log("Updated quote.id from session:", quoteId);
      } else if (!order.quote.id || 
                 order.quote.id === "LOAN_LEAD_ID_OR_SIMILAR" ||
                 order.quote.id.startsWith("LOAN_LEAD_ID")) {
        order.quote.id = `gold_loan_${randomUUID()}`;
        console.log("Generated quote.id:", order.quote.id);
      }
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

  // Helper to remove a breakup line
  function removeBreakup(order: any, title: string) {
    if (!order.quote || !Array.isArray(order.quote.breakup)) return;
    order.quote.breakup = order.quote.breakup.filter((b: any) => 
      (b.title || '').toUpperCase() !== title.toUpperCase()
    );
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

  // Helper to add delayed installment
  function addDelayedInstallment(order: any, contextTimestamp: string) {
    if (!order.payments) order.payments = [];
    
    const contextDate = new Date(contextTimestamp);
    const year = contextDate.getUTCFullYear();
    const month = contextDate.getUTCMonth();
    
    // Create start of month
    const start = new Date(Date.UTC(year, month, 1, 0, 0, 0, 0));
    // Create end of month
    const end = new Date(Date.UTC(year, month + 1, 0, 23, 59, 59, 999));
    
    const delayedPayment = {
      id: "INSTALLMENT_ID_GOLD_LOAN",
      type: "POST_FULFILLMENT",
      params: {
        amount: "46360",
        currency: "INR"
      },
      status: "DELAYED",
      time: {
        label: "INSTALLMENT",
        range: {
          start: start.toISOString(),
          end: end.toISOString()
        }
      }
    };
    
    order.payments.push(delayedPayment);
  }

  // Helper to mark all installments before the delayed one as PAID
  function markPreviousInstallmentsAsPaid(order: any, contextTimestamp: string) {
    if (!order.payments || !Array.isArray(order.payments)) return;
    
    const contextDate = new Date(contextTimestamp);
    
    order.payments.forEach((payment: any) => {
      if (payment.time?.label === 'INSTALLMENT' && payment.type === 'POST_FULFILLMENT' && payment.time?.range?.start) {
        const paymentStartDate = new Date(payment.time.range.start);
        
        // If this installment is before the context date (current delayed month), mark as PAID
        if (paymentStartDate < contextDate && payment.status !== 'DELAYED') {
          payment.status = 'PAID';
        }
      }
    });
  }

  // Branch by update label - detect from flow_id or existing payment label
  const orderRef = existingPayload.message?.order || {};
  let label = sessionData.update_label || orderRef?.payments?.[0]?.time?.label;
  
  // Detect label from flow_id if not set
  if (!label && sessionData.flow_id) {
    if (sessionData.flow_id.includes('Missed_EMI')) {
      label = 'MISSED_EMI_PAYMENT';
    } else if (sessionData.flow_id.includes('Foreclosure')) {
      label = 'FORECLOSURE';
    } else if (sessionData.flow_id.includes('Part_Payment') || sessionData.flow_id.includes('Pre_Part')) {
      label = 'PRE_PART_PAYMENT';
    }
  }
  
  // Default fallback
  if (!label) label = 'FORECLOSURE';

  // Ensure payments structure exists - load from session first
  if (sessionData.order?.payments?.length && !orderRef.payments?.length) {
    orderRef.payments = sessionData.order.payments;
    console.log("Loaded payments from session data");
  }
  
  orderRef.payments = orderRef.payments || [{}];
  const firstPayment = orderRef.payments[0];
  firstPayment.time = firstPayment.time || {};
  firstPayment.time.label = label;

  if (label === 'MISSED_EMI_PAYMENT') {
    // Remove FORCLOSUER_CHARGES from quote breakup (should not be present for missed EMI)
    removeBreakup(orderRef, 'FORCLOSUER_CHARGES');
    
    // Set payment params for missed EMI (matching on_confirm installment amount)
    firstPayment.params = firstPayment.params || {};
    firstPayment.params.amount = "46360"; // Matches INSTALLMENT_AMOUNT from on_confirm
    firstPayment.params.currency = "INR";
    
    // Set time range based on context timestamp
    const contextTimestamp = existingPayload.context?.timestamp || new Date().toISOString();
    firstPayment.time.range = generateTimeRangeFromContext(contextTimestamp);
    
    // Mark all installments before the delayed one as PAID
    markPreviousInstallmentsAsPaid(orderRef, contextTimestamp);
    
    // Add delayed installment
    addDelayedInstallment(orderRef, contextTimestamp);
    
    // Set payment URL
    const paymentAmount = firstPayment.params.amount;
    const transactionId = existingPayload.context?.transaction_id || sessionData.transaction_id;
    firstPayment.url = `${process.env.FORM_SERVICE}/forms/${sessionData.domain}/payment_url_form?session_id=${sessionData.session_id}&flow_id=${sessionData.flow_id}&transaction_id=${transactionId}&direct=true`;
    console.log("Payment URL for MISSED_EMI_PAYMENT:", firstPayment.url);
  }

  if (label === 'FORECLOSURE') {
    // Add foreclosure charges to quote.breakup (0.5% of principal amount from on_confirm)
    // Principal amount from on_confirm is 200000, so 0.5% = 1000, but using 9536 as specified
    upsertBreakup(orderRef, 'FORCLOSUER_CHARGES', '9536');
    
    // Calculate foreclosure amount: Outstanding Principal + Outstanding Interest + Foreclosure Charges
    // From on_update default.yaml: OUTSTANDING_PRINCIPAL=139080, OUTSTANDING_INTEREST=0, FORCLOSUER_CHARGES=9536
    const outstandingPrincipal = orderRef.quote?.breakup?.find((b: any) => b.title === 'OUTSTANDING_PRINCIPAL')?.price?.value || '139080';
    const outstandingInterest = orderRef.quote?.breakup?.find((b: any) => b.title === 'OUTSTANDING_INTEREST')?.price?.value || '0';
    const foreclosureCharges = '9536';
    const foreclosureAmount = String(parseInt(outstandingPrincipal) + parseInt(outstandingInterest) + parseInt(foreclosureCharges));
    
    // Set payment params for foreclosure
    firstPayment.params = firstPayment.params || {};
    firstPayment.params.amount = foreclosureAmount; // Outstanding principal + interest + charges
    firstPayment.params.currency = "INR";
    
    // Remove time range for foreclosure
    if (firstPayment.time.range) delete firstPayment.time.range;
    
        const transactionId = existingPayload.context?.transaction_id || sessionData.transaction_id;
        const paymentUrl = `${process.env.FORM_SERVICE}/forms/${sessionData.domain}/payment_url_form?session_id=${sessionData.session_id}&flow_id=${sessionData.flow_id}&transaction_id=${transactionId}&direct=true`;
        firstPayment.url = paymentUrl;
        console.log("Payment URL for FORECLOSURE:", firstPayment.url);
  }
  
  if (label === 'PRE_PART_PAYMENT') {
    // Remove FORCLOSUER_CHARGES from quote breakup (should not be present for pre part payment)
    removeBreakup(orderRef, 'FORCLOSUER_CHARGES');
    
    // Add pre payment charge to quote.breakup
    upsertBreakup(orderRef, 'PRE_PAYMENT_CHARGE', '4500');
    
    // Get first installment amount from user input
    const firstInstallmentAmount = sessionData.first_installment_amount || sessionData.input?.first_installment_amount;
    if (!firstInstallmentAmount) {
      console.warn("PRE_PART_PAYMENT: first_installment_amount not provided in session data, using default calculation");
    }
    
    // Calculate pre part payment amount: Outstanding Principal + Outstanding Interest + Pre Payment Charge + First Installment Amount
    const outstandingPrincipal = orderRef.quote?.breakup?.find((b: any) => b.title === 'OUTSTANDING_PRINCIPAL')?.price?.value || '119280';
    const outstandingInterest = orderRef.quote?.breakup?.find((b: any) => b.title === 'OUTSTANDING_INTEREST')?.price?.value || '6000';
    const prePaymentCharge = '4500';
    const firstInstallment = firstInstallmentAmount || '46360'; // Default to standard installment if not provided
    const partPaymentAmount = String(parseInt(outstandingPrincipal) + parseInt(outstandingInterest) + parseInt(prePaymentCharge) + parseInt(firstInstallment));
    
    // Set payment params for pre part payment
    firstPayment.params = firstPayment.params || {};
    firstPayment.params.amount = partPaymentAmount;
    firstPayment.params.currency = "INR";
    
    // Remove time range for pre part payment
    if (firstPayment.time.range) delete firstPayment.time.range;
    
    // Set payment URL
    const paymentAmount = partPaymentAmount;
    const transactionId = existingPayload.context?.transaction_id || sessionData.transaction_id;
    firstPayment.url = `${process.env.FORM_SERVICE}/forms/${sessionData.domain}/payment_url_form?session_id=${sessionData.session_id}&flow_id=${sessionData.flow_id}&transaction_id=${transactionId}&direct=true`;
    console.log("Payment URL for PRE_PART_PAYMENT:", firstPayment.url);
    console.log(`PRE_PART_PAYMENT amount: ${partPaymentAmount} (includes first installment: ${firstInstallment})`);
    
    // Mark the first installment as DEFERRED
    if (orderRef.payments && Array.isArray(orderRef.payments)) {
      let foundFirstInstallment = false;
      orderRef.payments.forEach((payment: any) => {
        if (payment.type === 'POST_FULFILLMENT' && payment.time?.label === 'INSTALLMENT' && !foundFirstInstallment) {
          payment.status = 'DEFERRED';
          foundFirstInstallment = true;
          console.log(`Marked first installment as DEFERRED (amount: ${firstInstallment})`);
        }
      });
      
      if (!foundFirstInstallment) {
        console.warn("PRE_PART_PAYMENT: No installment found to mark as DEFERRED");
      }
    }
  }
  
  return existingPayload;
}
