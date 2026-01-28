import { X, Lock } from 'lucide-react';

interface PaywallModalProps {
  onClose: () => void;
}

export default function PaywallModal({ onClose }: PaywallModalProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-900 rounded-lg max-w-md w-full p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-yellow-400 rounded-full mb-4">
            <Lock className="w-8 h-8 text-black" />
          </div>

          <h2 className="text-2xl font-bold text-white mb-2">
            Free Audit Limit Reached
          </h2>

          <p className="text-gray-400 mb-6">
            You've used all 5 of your free property audits. Upgrade to unlock unlimited audits and advanced features.
          </p>

          <div className="bg-gray-800 rounded-lg p-4 mb-6 text-left">
            <h3 className="text-white font-semibold mb-3">Premium Features:</h3>
            <ul className="space-y-2 text-gray-300 text-sm">
              <li className="flex items-start gap-2">
                <span className="text-yellow-400 mt-1">✓</span>
                <span>Unlimited property audits</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-yellow-400 mt-1">✓</span>
                <span>Advanced market analytics</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-yellow-400 mt-1">✓</span>
                <span>Priority support</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-yellow-400 mt-1">✓</span>
                <span>Export reports</span>
              </li>
            </ul>
          </div>

          <button
            onClick={() => {
              alert('Payment integration coming soon');
            }}
            className="w-full px-6 py-3 bg-yellow-400 text-black rounded-lg hover:bg-yellow-300 font-semibold transition-colors mb-3"
          >
            Upgrade Now
          </button>

          <button
            onClick={onClose}
            className="w-full px-6 py-3 text-gray-400 hover:text-white transition-colors"
          >
            Maybe Later
          </button>
        </div>
      </div>
    </div>
  );
}
