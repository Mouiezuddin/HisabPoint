import React from 'react';
import { Modal } from './Modal';
import { showToast } from './Toast';

interface UpiQrModalProps {
  isOpen: boolean;
  onClose: () => void;
  customerName: string;
  amount: string;
  upiId?: string;
  shopName?: string;
}

export function UpiQrModal({
  isOpen,
  onClose,
  customerName,
  amount,
  upiId = 'shopkeeper@upi',
  shopName = 'ABC General Store',
}: UpiQrModalProps) {
  const cleanAmount = parseFloat(amount) || 0;
  const upiUrl = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(shopName)}&am=${cleanAmount}&cu=INR&tn=${encodeURIComponent(`Dues Payment - ${customerName}`)}`;
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(upiUrl)}`;

  function handleCopyUpi() {
    navigator.clipboard.writeText(upiId);
    showToast(`UPI ID ${upiId} copied!`, 'success');
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Scan QR Code to Pay">
      <div className="text-center space-y-4 py-1">
        <div>
          <p className="text-xs text-stone-600 font-medium">Customer: <strong className="text-stone-900 font-serif">{customerName}</strong></p>
          <p className="text-2xl font-black font-serif text-rose-800 font-tabular mt-1">₹{amount}</p>
        </div>

        {/* QR Code Card */}
        <div className="bg-white rounded-2xl p-4 border-2 border-parchment-300 shadow-md inline-block mx-auto">
          <img
            src={qrImageUrl}
            alt={`UPI QR Code for ₹${amount}`}
            className="w-48 h-48 mx-auto"
          />
          <div className="mt-3 pt-2 border-t border-stone-200 flex items-center justify-center gap-2">
            <span className="text-xs font-bold text-stone-700">UPI ID:</span>
            <span className="text-xs font-mono font-bold text-stone-900">{upiId}</span>
            <button
              onClick={handleCopyUpi}
              className="text-[10px] font-bold text-forest-800 hover:underline"
            >
              Copy
            </button>
          </div>
        </div>

        {/* Payment App Logos */}
        <div className="flex items-center justify-center gap-4 text-xs font-bold text-stone-600 pt-1">
          <span>GPay</span>
          <span>•</span>
          <span>PhonePe</span>
          <span>•</span>
          <span>Paytm</span>
          <span>•</span>
          <span>BHIM</span>
        </div>
      </div>
    </Modal>
  );
}
