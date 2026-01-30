// Gold Loan imports
import { MockSearchClass } from "./gold-loan/2.0.2/search/class";
import { MockOnSearchClass } from "./gold-loan/2.0.2/on_search/class";
import { MockSelectAdjustLoanAmountClass} from "./gold-loan/2.0.2/select_adjust_loan_amount/class";
import { MockSelect1Class } from "./gold-loan/2.0.2/select_1/class";
import { MockSelect2Class } from "./gold-loan/2.0.2/select_2/class";
import { MockSelectBureauLoanClass } from "./gold-loan/2.0.2/select_bureau_loan/class";
import { MockOnSelectAdjustLoanAmountClass } from "./gold-loan/2.0.2/on_select_adjust_loan_amount/class";
import { MockOnSelect1Class } from "./gold-loan/2.0.2/on_select_1/class";
import { MockOnSelect2Class } from "./gold-loan/2.0.2/on_select_2/class";
import { MockInitClass } from "./gold-loan/2.0.2/init/class";
import { MockOnInitClass } from "./gold-loan/2.0.2/on_init/class";
import { MockConfirmClass } from "./gold-loan/2.0.2/confirm/class";
import { MockOnConfirmClass } from "./gold-loan/2.0.2/on_confirm/class";
import { MockUpdateClass } from "./gold-loan/2.0.2/update/class";
import { MockOnUpdateClass } from "./gold-loan/2.0.2/on_update/class";
import { MockOnUpdateForeclosureClass } from "./gold-loan/2.0.2/on_update_foreclosure/class";
import { MockOnUpdateMissedEmiClass } from "./gold-loan/2.0.2/on_update_missed_emi/class";
import { MockOnUpdatePrePartPaymentClass } from "./gold-loan/2.0.2/on_update_pre_part_payment/class";
import { MockOnUpdateUnsolicitedClass } from "./gold-loan/2.0.2/on_update_unsolicited/class";
import type { MockAction } from "./classes/mock-action";
import { MockConsumerInformationFormClass } from "./gold-loan/2.0.2/form/consumer_information_form";
import { MockVerificationStatusClass } from "./gold-loan/2.0.2/form_2/verification_status";
import { MockStatusClass } from "./gold-loan/2.0.2/status/class";
import { MockOnStatusClass } from "./gold-loan/2.0.2/on_status/class";
import { MockOnStatusUnsolicitedClass } from "./gold-loan/2.0.2/on_status_unsolicited/class";

// Personal Loan 2.0.2 imports
import { MockSearchPersonalLoanClass } from "./personal-loan/2.0.2/search/class";
import { MockOnSearchPersonalLoanClass } from "./personal-loan/2.0.2/on_search/class";
import { MockSelectBureauConsentPersonalLoanClass } from "./personal-loan/2.0.2/select_bureau_consent_personal_loan/class";
import { MockOnSelectBureauConsentPersonalLoanClass } from "./personal-loan/2.0.2/on_select_bureau_consent_personal_loan/class";
import { MockSelect1PersonalLoanClass } from "./personal-loan/2.0.2/select_1/class";
import { MockSelect2PersonalLoanClass } from "./personal-loan/2.0.2/select_2/class";
import { MockOnSelect1PersonalLoanClass } from "./personal-loan/2.0.2/on_select_1/class";
import { MockOnSelect2PersonalLoanClass } from "./personal-loan/2.0.2/on_select_2/class";
import { MockInitOfflineAndOnlinePersonalLoanClass } from "./personal-loan/2.0.2/init_offline_and_online_personal_loan/class";
import { MockOnInitOfflineAndOnlinePersonalLoanClass } from "./personal-loan/2.0.2/on_init_offline_and_online_personal_loan/class";
import { MockConfirmPersonalLoanClass } from "./personal-loan/2.0.2/confirm/class";
import { MockOnConfirmPersonalLoanClass } from "./personal-loan/2.0.2/on_confirm/class";
import { MockUpdatePersonalLoanClass } from "./personal-loan/2.0.2/update/class";
import { MockOnUpdatePersonalLoanClass } from "./personal-loan/2.0.2/on_update/class";
import { MockOnUpdateUnsolicitedPersonalLoanClass } from "./personal-loan/2.0.2/on_update_unsolicited/class";
import { MockStatusPersonalLoanClass } from "./personal-loan/2.0.2/status/class";
import { MockOnStatusPersonalLoanClass } from "./personal-loan/2.0.2/on_status/class";
import { MockOnStatusUnsolicitedPersonalLoanClass } from "./personal-loan/2.0.2/on_status_unsolicited/class";
import { MockInitOfflinePersonalLoanClass } from "./personal-loan/2.0.2/init_offline/class";
import { MockOnInitOfflinePersonalLoanClass } from "./personal-loan/2.0.2/on_init_offline_personal_loan/class";
import { MockInit1PersonalLoanClass } from "./personal-loan/2.0.2/init_1/class";
import { MockInit2PersonalLoanClass } from "./personal-loan/2.0.2/init_2/class";
import { MockInit3PersonalLoanClass } from "./personal-loan/2.0.2/init_3/class";
import { MockOnInit1PersonalLoanClass } from "./personal-loan/2.0.2/on_init_1/class";
import { MockOnInit2PersonalLoanClass } from "./personal-loan/2.0.2/on_init_2/class";
import { MockOnInit3PersonalLoanClass } from "./personal-loan/2.0.2/on_init_3/class";
import { MockSelect3PersonalLoanClass } from "./personal-loan/2.0.2/select_3/class";
import { MockOnSelect3PersonalLoanClass } from "./personal-loan/2.0.2/on_select_3/class";
import { MockStatus1PersonalLoanClass } from "./personal-loan/2.0.2/status_1/class";
import { MockOnStatus1PersonalLoanClass } from "./personal-loan/2.0.2/on_status_1/class";
import { MockUpdatePersonalLoanFulfillmentClass } from "./personal-loan/2.0.2/update_personal_loan_fulfillment/class";
import { MockOnUpdatePersonalLoanFulfillmentClass } from "./personal-loan/2.0.2/on_update_personal_loan_fulfillment/class";
import { MockLoanAdjustmentFormClass } from "./personal-loan/2.0.2/loan-adjustment-form/loan-amount-adjustment-form";
import { MockMandateDetailsForm } from "./personal-loan/2.0.2/mandate-details-form/manadate-details-form";
import { MockPersonalLoanInformationFormClass } from "./personal-loan/2.0.2/personal_loan_information_form/class";

// Personal Loan 2.0.1 imports
import { MockSearchPersonalLoanClass as MockSearchPersonalLoan201Class } from "./personal-loan/2.0.1/search/class";
import { MockOnSearchPersonalLoanClass as MockOnSearchPersonalLoan201Class } from "./personal-loan/2.0.1/on_search/class";
import { MockSelectBureauConsentPersonalLoanClass as MockSelectBureauConsentPersonalLoan201Class } from "./personal-loan/2.0.1/select_bureau_consent_personal_loan/class";
import { MockOnSelectBureauConsentPersonalLoanClass as MockOnSelectBureauConsentPersonalLoan201Class } from "./personal-loan/2.0.1/on_select_bureau_consent_personal_loan/class";
import { MockSelect1PersonalLoanClass as MockSelect1PersonalLoan201Class } from "./personal-loan/2.0.1/select_1/class";
import { MockSelect2PersonalLoanClass as MockSelect2PersonalLoan201Class } from "./personal-loan/2.0.1/select_2/class";
import { MockOnSelect1PersonalLoanClass as MockOnSelect1PersonalLoan201Class } from "./personal-loan/2.0.1/on_select_1/class";
import { MockOnSelect2PersonalLoanClass as MockOnSelect2PersonalLoan201Class } from "./personal-loan/2.0.1/on_select_2/class";
import { MockSelect3PersonalLoanClass as MockSelect3PersonalLoan201Class } from "./personal-loan/2.0.1/select_3/class";
import { MockOnSelect3PersonalLoanClass as MockOnSelect3PersonalLoan201Class } from "./personal-loan/2.0.1/on_select_3/class";
import { MockInitOfflineAndOnlinePersonalLoanClass as MockInitOfflineAndOnlinePersonalLoan201Class } from "./personal-loan/2.0.1/init_offline_and_online_personal_loan/class";
import { MockOnInitOfflineAndOnlinePersonalLoanClass as MockOnInitOfflineAndOnlinePersonalLoan201Class } from "./personal-loan/2.0.1/on_init_offline_and_online_personal_loan/class";
import { MockInitOfflinePersonalLoanClass as MockInitOfflinePersonalLoan201Class } from "./personal-loan/2.0.1/init_offline/class";
import { MockOnInitOfflinePersonalLoanClass as MockOnInitOfflinePersonalLoan201Class } from "./personal-loan/2.0.1/on_init_offline_personal_loan/class";
import { MockInit1PersonalLoanClass as MockInit1PersonalLoan201Class } from "./personal-loan/2.0.1/init_1/class";
import { MockInit2PersonalLoanClass as MockInit2PersonalLoan201Class } from "./personal-loan/2.0.1/init_2/class";
import { MockInit3PersonalLoanClass as MockInit3PersonalLoan201Class } from "./personal-loan/2.0.1/init_3/class";
import { MockOnInit1PersonalLoanClass as MockOnInit1PersonalLoan201Class } from "./personal-loan/2.0.1/on_init_1/class";
import { MockOnInit2PersonalLoanClass as MockOnInit2PersonalLoan201Class } from "./personal-loan/2.0.1/on_init_2/class";
import { MockOnInit3PersonalLoanClass as MockOnInit3PersonalLoan201Class } from "./personal-loan/2.0.1/on_init_3/class";
import { MockConfirmPersonalLoanClass as MockConfirmPersonalLoan201Class } from "./personal-loan/2.0.1/confirm/class";
import { MockOnConfirmPersonalLoanClass as MockOnConfirmPersonalLoan201Class } from "./personal-loan/2.0.1/on_confirm/class";
import { MockUpdatePersonalLoanClass as MockUpdatePersonalLoan201Class } from "./personal-loan/2.0.1/update/class";
import { MockOnUpdatePersonalLoanClass as MockOnUpdatePersonalLoan201Class } from "./personal-loan/2.0.1/on_update/class";
import { MockOnUpdateUnsolicitedPersonalLoanClass as MockOnUpdateUnsolicitedPersonalLoan201Class } from "./personal-loan/2.0.1/on_update_unsolicited/class";
import { MockUpdatePersonalLoanFulfillmentClass as MockUpdatePersonalLoanFulfillment201Class } from "./personal-loan/2.0.1/update_personal_loan_fulfillment/class";
import { MockOnUpdatePersonalLoanFulfillmentClass as MockOnUpdatePersonalLoanFulfillment201Class } from "./personal-loan/2.0.1/on_update_personal_loan_fulfillment/class";
import { MockStatusPersonalLoanClass as MockStatusPersonalLoan201Class } from "./personal-loan/2.0.1/status/class";
import { MockOnStatusPersonalLoanClass as MockOnStatusPersonalLoan201Class } from "./personal-loan/2.0.1/on_status/class";
import { MockStatus1PersonalLoanClass as MockStatus1PersonalLoan201Class } from "./personal-loan/2.0.1/status_1/class";
import { MockOnStatus1PersonalLoanClass as MockOnStatus1PersonalLoan201Class } from "./personal-loan/2.0.1/on_status_1/class";
import { MockOnStatusUnsolicitedPersonalLoanClass as MockOnStatusUnsolicitedPersonalLoan201Class } from "./personal-loan/2.0.1/on_status_unsolicited/class";
import { MockLoanAdjustmentFormClass as MockLoanAdjustmentForm201Class } from "./personal-loan/2.0.1/loan-adjustment-form/loan-amount-adjustment-form";
import { MockMandateDetailsForm as MockMandateDetails201Form } from "./personal-loan/2.0.1/mandate-details-form/manadate-details-form";
import { MockPersonalLoanInformationFormClass as MockPersonalLoanInformationForm201Class } from "./personal-loan/2.0.1/personal_loan_information_form/class";
import { MockConsumerInformationFormPl202Class as MockConsumerInformationForm201Class } from "./personal-loan/2.0.1/form/consumer_information_form";
import { MockEKycVerificationStatusPl202Class as MockEKycVerificationStatus201Class } from "./personal-loan/2.0.1/form_2/kyc_verification_status";
import { MockPaymentUrlFormStatusClass as MockPaymentUrlForm201Class } from "./personal-loan/2.0.1/form_3/payment_url_form";
import { MockVerificationPlStatusClass as MockVerificationStatus201Class } from "./personal-loan/2.0.1/form_4/verification_status";
import { MockSelect3Class } from "./gold-loan/2.0.2/select_3/class";
import { MockOnSelect3Class } from "./gold-loan/2.0.2/on_select_3/class";
import { MockEkycVerificationStatusClass } from "./gold-loan/2.0.2/form_3/ekyc_details_form";
import { MockSelectMultipleOfferClass } from "./gold-loan/2.0.2/select_multiple_offer_1/class";
import { MockOnSelectMultipleOfferClass } from "./gold-loan/2.0.2/on_select_multiple_offer_1/class";
import { MockConsumerInformationFormPl202Class } from "./personal-loan/2.0.2/form/consumer_information_form";
import { MockEKycVerificationStatusPl202Class } from "./personal-loan/2.0.2/form_2/kyc_verification_status";
import { MockPaymentUrlFormStatusClass } from "./personal-loan/2.0.2/form_3/payment_url_form";
import { MockVerificationPlStatusClass } from "./personal-loan/2.0.2/form_4/verification_status";
import { MockIssueOpenGoldLoan_100_Class } from "./gold-loan/2.0.2/issue/issue_100/issue_open/class";
import { MockIssueCloseGoldLoan_100_Class } from "./gold-loan/2.0.2/issue/issue_100/issue_close/class";
import { MockOnIssueResolvedGoldLoan_100_Class } from "./gold-loan/2.0.2/on_issue/on_issue_100/on_issue_resolved/class";
import { MockOnIssueProcessingGoldLoan_100_Class } from "./gold-loan/2.0.2/on_issue/on_issue_100/on_issue_processing/class";

type Ctor<T> = new () => T;

const registry = {

	// Gold Loan actions
	// search
    search: MockSearchClass,
	// on_search
	on_search: MockOnSearchClass,

	// select
	select_1: MockSelect1Class,
	select_2: MockSelect2Class,
	select_multiple_offer: MockSelectMultipleOfferClass,
	on_select_multiple_offer: MockOnSelectMultipleOfferClass,
	select_gold_3: MockSelect3Class,
	on_select_1: MockOnSelect1Class,
	on_select_2: MockOnSelect2Class,
	on_select_gold_3: MockOnSelect3Class,
	select_bureau_loan: MockSelectBureauLoanClass,
	select_adjust_loan_amount: MockSelectAdjustLoanAmountClass,
	on_select_adjust_loan_amount: MockOnSelectAdjustLoanAmountClass,
	// init / on_init
	init: MockInitClass,
	on_init: MockOnInitClass,

	// confirm / on_confirm
	confirm: MockConfirmClass,
	on_confirm: MockOnConfirmClass,

	// status / on_status
	status: MockStatusClass,
	on_status: MockOnStatusClass,
	on_status_unsolicited: MockOnStatusUnsolicitedClass,

	// update / on_update
	update: MockUpdateClass,
	on_update: MockOnUpdateClass,
	on_update_foreclosure: MockOnUpdateForeclosureClass,
	on_update_missed_emi: MockOnUpdateMissedEmiClass,
	on_update_pre_part_payment: MockOnUpdatePrePartPaymentClass,
	on_update_unsolicited: MockOnUpdateUnsolicitedClass,
	consumer_information_form_pl_202: MockConsumerInformationFormPl202Class,
	consumer_information_form: MockConsumerInformationFormClass,
	consumer_information_form_1: MockConsumerInformationFormClass,
	verification_status: MockVerificationStatusClass,
	verification_status_pl: MockVerificationPlStatusClass,
	Ekyc_details_form: MockEkycVerificationStatusClass,
	Ekyc_details_form_pl_202: MockEKycVerificationStatusPl202Class,
	payment_url_form: MockPaymentUrlFormStatusClass,
	loan_amount_adjustment_form: MockLoanAdjustmentFormClass,
	manadate_details_form: MockMandateDetailsForm,
	personal_loan_information_form: MockPersonalLoanInformationFormClass,

	// Personal Loan 2.0.2 actions
	search_personal_loan: MockSearchPersonalLoanClass,
	on_search_personal_loan: MockOnSearchPersonalLoanClass,
	select_bureau_consent_personal_loan: MockSelectBureauConsentPersonalLoanClass,
	on_select_bureau_consent_personal_loan: MockOnSelectBureauConsentPersonalLoanClass,
	select_1_personal_loan: MockSelect1PersonalLoanClass,
	select_2_personal_loan: MockSelect2PersonalLoanClass,
	on_select_1_personal_loan: MockOnSelect1PersonalLoanClass,
	on_select_2_personal_loan: MockOnSelect2PersonalLoanClass,
	select_3_personal_loan: MockSelect3PersonalLoanClass,
	on_select_3_personal_loan: MockOnSelect3PersonalLoanClass,
	confirm_personal_loan: MockConfirmPersonalLoanClass,
	on_confirm_personal_loan: MockOnConfirmPersonalLoanClass,
	update_personal_loan: MockUpdatePersonalLoanClass,
	on_update_personal_loan: MockOnUpdatePersonalLoanClass,
	on_update_unsolicited_personal_loan: MockOnUpdateUnsolicitedPersonalLoanClass,
	status_personal_loan: MockStatusPersonalLoanClass,
	on_status_personal_loan: MockOnStatusPersonalLoanClass,
	on_status_unsolicited_personal_loan: MockOnStatusUnsolicitedPersonalLoanClass,
	init_offline_personal_loan: MockInitOfflinePersonalLoanClass,
	on_init_offline_personal_loan: MockOnInitOfflinePersonalLoanClass,
	init_offline_and_online_personal_loan: MockInitOfflineAndOnlinePersonalLoanClass,
	on_init_offline_and_online_personal_loan: MockOnInitOfflineAndOnlinePersonalLoanClass,
	init_1_personal_loan: MockInit1PersonalLoanClass,
	init_2_personal_loan: MockInit2PersonalLoanClass,
	init_3_personal_loan: MockInit3PersonalLoanClass,
	on_init_1_personal_loan: MockOnInit1PersonalLoanClass,
	on_init_2_personal_loan: MockOnInit2PersonalLoanClass,
	on_init_3_personal_loan: MockOnInit3PersonalLoanClass,
	status_1_personal_loan: MockStatus1PersonalLoanClass,
	on_status_1_personal_loan: MockOnStatus1PersonalLoanClass,
	update_personal_loan_fulfillment: MockUpdatePersonalLoanFulfillmentClass,
	on_update_personal_loan_fulfillment: MockOnUpdatePersonalLoanFulfillmentClass,

	// Personal Loan 2.0.1 actions
	search_personal_loan_201: MockSearchPersonalLoan201Class,
	on_search_personal_loan_201: MockOnSearchPersonalLoan201Class,
	select_bureau_consent_personal_loan_201: MockSelectBureauConsentPersonalLoan201Class,
	on_select_bureau_consent_personal_loan_201: MockOnSelectBureauConsentPersonalLoan201Class,
	select_1_personal_loan_201: MockSelect1PersonalLoan201Class,
	select_2_personal_loan_201: MockSelect2PersonalLoan201Class,
	on_select_1_personal_loan_201: MockOnSelect1PersonalLoan201Class,
	on_select_2_personal_loan_201: MockOnSelect2PersonalLoan201Class,
	select_3_personal_loan_201: MockSelect3PersonalLoan201Class,
	on_select_3_personal_loan_201: MockOnSelect3PersonalLoan201Class,
	confirm_personal_loan_201: MockConfirmPersonalLoan201Class,
	on_confirm_personal_loan_201: MockOnConfirmPersonalLoan201Class,
	update_personal_loan_201: MockUpdatePersonalLoan201Class,
	on_update_personal_loan_201: MockOnUpdatePersonalLoan201Class,
	on_update_unsolicited_personal_loan_201: MockOnUpdateUnsolicitedPersonalLoan201Class,
	status_personal_loan_201: MockStatusPersonalLoan201Class,
	on_status_personal_loan_201: MockOnStatusPersonalLoan201Class,
	on_status_unsolicited_personal_loan_201: MockOnStatusUnsolicitedPersonalLoan201Class,
	init_offline_personal_loan_201: MockInitOfflinePersonalLoan201Class,
	on_init_offline_personal_loan_201: MockOnInitOfflinePersonalLoan201Class,
	init_offline_and_online_personal_loan_201: MockInitOfflineAndOnlinePersonalLoan201Class,
	on_init_offline_and_online_personal_loan_201: MockOnInitOfflineAndOnlinePersonalLoan201Class,
	init_1_personal_loan_201: MockInit1PersonalLoan201Class,
	init_2_personal_loan_201: MockInit2PersonalLoan201Class,
	init_3_personal_loan_201: MockInit3PersonalLoan201Class,
	on_init_1_personal_loan_201: MockOnInit1PersonalLoan201Class,
	on_init_2_personal_loan_201: MockOnInit2PersonalLoan201Class,
	on_init_3_personal_loan_201: MockOnInit3PersonalLoan201Class,
	status_1_personal_loan_201: MockStatus1PersonalLoan201Class,
	on_status_1_personal_loan_201: MockOnStatus1PersonalLoan201Class,
	update_personal_loan_fulfillment_201: MockUpdatePersonalLoanFulfillment201Class,
	on_update_personal_loan_fulfillment_201: MockOnUpdatePersonalLoanFulfillment201Class,
	consumer_information_form_pl_201: MockConsumerInformationForm201Class,
	Ekyc_details_form_pl_201: MockEKycVerificationStatus201Class,
	payment_url_form_pl_201: MockPaymentUrlForm201Class,
	verification_status_pl_201: MockVerificationStatus201Class,
	loan_amount_adjustment_form_pl_201: MockLoanAdjustmentForm201Class,
	manadate_details_form_pl_201: MockMandateDetails201Form,
	personal_loan_information_form_pl_201: MockPersonalLoanInformationForm201Class,

	// _____________IGM_1.0.0 for Gold Loan (2.0.2)______________
	issue_open_GD_100:  MockIssueOpenGoldLoan_100_Class,
	issue_close_GD_100: MockIssueCloseGoldLoan_100_Class,
	on_issue_processing_GD_100: MockOnIssueProcessingGoldLoan_100_Class,
	on_issue_resolved_GD_100: MockOnIssueResolvedGoldLoan_100_Class

} as const satisfies Record<string, Ctor<MockAction>>;

type MockActionId = keyof typeof registry;

// Construct by id
export function getMockAction(actionId: string): MockAction {
	const Ctor = registry[actionId as MockActionId];
	if (!Ctor) {
		throw new Error(`Action with ID ${actionId as string} not found`);
	}
	return new Ctor();
}

// List all possible ids — stays in sync automatically
export function listMockActions(): MockActionId[] {
	return Object.keys(registry) as MockActionId[];
}
