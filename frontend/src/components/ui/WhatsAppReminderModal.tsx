import React, { useState } from 'react';
import { Modal } from './Modal';
import { showToast } from './Toast';

interface WhatsAppReminderModalProps {
  isOpen: boolean;
  onClose: () => void;
  customerName: string;
  customerPhone: string;
  dueAmount: string;
  shopName?: string;
}

export function WhatsAppReminderModal({
  isOpen,
  onClose,
  customerName,
  customerPhone,
  dueAmount,
  shopName = 'ABC General Store',
}: WhatsAppReminderModalProps) {
  const defaultMessage = `Namaste ${customerName} ji, your pending balance at ${shopName} is ₹${dueAmount}. Kindly settle at your convenience via UPI/Cash. Thank you!`;
  const [message, setMessage] = useState(defaultMessage);

  function handleSendWhatsApp() {
    const cleanPhone = customerPhone.replace(/\D/g, '');
    const phoneWithCountry = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
    const url = `https://wa.me/${phoneWithCountry}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
    showToast('Opening WhatsApp…', 'info');
    onClose();
  }

  function handleCopyText() {
    navigator.clipboard.writeText(message);
    showToast('Reminder message copied to clipboard!', 'success');
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Send WhatsApp Payment Reminder">
      <div className="space-y-4">
        <div className="bg-emerald-50 rounded-xl p-3 border border-emerald-200 flex items-center justify-between text-xs">
          <div>
            <span className="font-bold text-stone-700 font-serif">Customer: </span>
            <span className="font-bold text-stone-900">{customerName}</span>
            <p className="text-stone-500 font-mono text-[11px]">📞 {customerPhone || 'No phone number'}</p>
          </div>
          <div className="text-right">
            <span className="text-[10px] font-bold text-stone-500 uppercase">Amount Due</span>
            <p className="text-base font-black font-serif text-rose-800 font-tabular">₹{dueAmount}</p>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-stone-700 mb-1" htmlFor="wa-msg">
            Edit Reminder Message
          </label>
          <textarea
            id="wa-msg"
            rows={4}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="input text-xs resize-none font-serif leading-relaxed"
          />
        </div>

        <div className="flex gap-2 pt-2">
          <button
            type="button"
            onClick={handleCopyText}
            className="flex-1 py-2.5 bg-parchment-200 hover:bg-parchment-300 text-stone-800 font-bold text-xs rounded-xl border border-parchment-300"
          >
            📋 Copy Text
          </button>

          <button
            type="button"
            onClick={handleSendWhatsApp}
            className="flex-1 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-1.5"
          >
            <span>💬 Send WhatsApp</span>
          </button>
        </div>
      </div>
    </Modal>
  );
}
