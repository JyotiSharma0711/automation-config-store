/**
 * Shared utility functions for Personal Loan generators
 * These functions are used across multiple generators to avoid code duplication
 */

/**
 * Upsert a breakup line in the quote
 * If the breakup line exists, update it; otherwise, add it
 */
export function upsertBreakup(order: any, title: string, value: string, currency: string = 'INR') {
  order.quote = order.quote || { price: { currency: 'INR', value: '0' }, breakup: [] };
  order.quote.breakup = Array.isArray(order.quote.breakup) ? order.quote.breakup : [];
  const idx = order.quote.breakup.findIndex((b: any) => (b.title || '').toUpperCase() === title.toUpperCase());
  const row = { title, price: { value, currency } };
  if (idx >= 0) order.quote.breakup[idx] = row; else order.quote.breakup.push(row);
}

/**
 * Generate time range based on context timestamp
 * Returns start and end of the month for the given timestamp
 */
export function generateTimeRangeFromContext(contextTimestamp: string) {
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

/**
 * Update payment status for specific installments
 * @param payments - Array of payment objects
 * @param status - Status to set (PAID, DELAYED, DEFERRED, etc.)
 * @param count - Optional: number of installments to update
 */
export function updatePaymentStatus(payments: any[], status: string, count?: number) {
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

/**
 * Mark unpaid installments as DEFERRED for foreclosure
 * Keep already PAID installments as PAID
 */
export function updateForeclosurePaymentStatus(payments: any[]) {
  if (!Array.isArray(payments)) return;
  
  payments.forEach(payment => {
    if (payment.time?.label === 'INSTALLMENT' && payment.type === 'POST_FULFILLMENT') {
      // Keep already PAID installments as PAID, change others to DEFERRED
      if (payment.status !== 'PAID') {
        payment.status = 'NOT-PAID';
      }
    }
  });
}

/**
 * Update payment status for missed EMI (specific installment based on current month)
 */
export function updateMissedEMIStatus(payments: any[], contextTimestamp: string) {
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

/**
 * Update payment status for pre part payment (some PAID, some DEFERRED)
 */
export function updatePrePartPaymentStatus(payments: any[], contextTimestamp: string) {
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

/**
 * Add delayed installment for missed EMI scenario
 */
export function addDelayedInstallment(order: any, contextTimestamp: string) {
  if (!order.payments) order.payments = [];
  
  const contextDate = new Date(contextTimestamp);
  const year = contextDate.getUTCFullYear();
  const month = contextDate.getUTCMonth();
  
  // Create start of month
  const start = new Date(Date.UTC(year, month, 1, 0, 0, 0, 0));
  // Create end of month
  const end = new Date(Date.UTC(year, month + 1, 0, 23, 59, 59, 999));
  
  const delayedPayment = {
    id: "INSTALLMENT_ID_PERSONAL_LOAN",
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

/**
 * Mark all installments before the delayed one as PAID
 */
export function markPreviousInstallmentsAsPaid(order: any, contextTimestamp: string) {
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

