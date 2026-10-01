/**
 * `react-native-razorpay` ships plain JavaScript with no declarations of its
 * own. This is the part of it the app uses — the standard checkout — typed
 * from the package's README and Razorpay's checkout options.
 */
declare module 'react-native-razorpay' {
  export type RazorpayCheckoutOptions = {
    /** The public key id. */
    key: string;
    /** In the currency's smallest unit (paise). */
    amount: number | string;
    currency?: string;
    order_id?: string;
    name?: string;
    description?: string;
    image?: string;
    prefill?: {
      name?: string;
      email?: string;
      contact?: string;
      /** Opens the checkout on this method: 'upi' | 'card' | 'netbanking' | 'wallet'. */
      method?: string;
    };
    notes?: Record<string, string>;
    theme?: { color?: string };
    [key: string]: unknown;
  };

  /** What the checkout resolves with once a payment went through. */
  export type RazorpayCheckoutSuccess = {
    razorpay_payment_id: string;
    razorpay_order_id?: string;
    razorpay_signature?: string;
  };

  export default class RazorpayCheckout {
    /** Rejects with the SDK's own error payload (`{ code, description, … }`) when the checkout is dismissed or the payment fails. */
    static open(options: RazorpayCheckoutOptions): Promise<RazorpayCheckoutSuccess>;
  }
}
