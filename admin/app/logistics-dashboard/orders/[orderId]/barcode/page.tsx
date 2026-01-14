'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { getToken } from '@/lib/logisticsAuth';
import logisticsApi from '@/lib/logisticsApi';
import { QrCode, Barcode, ArrowLeft, Download } from 'lucide-react';

export default function OrderBarcodePage() {
  const router = useRouter();
  const params = useParams();
  const orderId = params.orderId as string;
  const [loading, setLoading] = useState(true);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [barcode, setBarcode] = useState<string | null>(null);
  const [orderNumber, setOrderNumber] = useState('');
  const [error, setError] = useState('');
  const [type, setType] = useState<'qr' | 'barcode'>('qr');

  useEffect(() => {
    if (orderId) {
      fetchBarcode();
    }
  }, [orderId, type]);

  const fetchBarcode = async () => {
    try {
      setLoading(true);
      setError('');

      const token = getToken();
      if (!token) {
        router.push('/logistics-login');
        return;
      }

      const response = await logisticsApi.get(`/logistics-companies/dashboard/orders/${orderId}/barcode`, {
        params: { type }
      });

      if (type === 'qr') {
        setQrCode(response.data.barcode);
      } else {
        setBarcode(response.data.barcode);
      }
      setOrderNumber(response.data.orderNumber);
    } catch (err: any) {
      console.error('Error fetching barcode:', err);
      setError(err.response?.data?.message || 'Failed to load barcode');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    const imageData = type === 'qr' ? qrCode : barcode;
    if (!imageData) return;

    const link = document.createElement('a');
    link.href = imageData;
    link.download = `${orderNumber}-${type === 'qr' ? 'qr-code' : 'barcode'}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <button
          onClick={() => router.back()}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          Back
        </button>
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <button
          onClick={() => router.back()}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          Back to Order
        </button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Barcode/QR Code</h1>
            <p className="mt-1 text-sm text-gray-500">Order: {orderNumber}</p>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setType('qr')}
              className={`px-4 py-2 rounded-md ${type === 'qr' ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-700'}`}
            >
              <QrCode className="h-4 w-4 inline mr-2" />
              QR Code
            </button>
            <button
              onClick={() => setType('barcode')}
              className={`px-4 py-2 rounded-md ${type === 'barcode' ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-700'}`}
            >
              <Barcode className="h-4 w-4 inline mr-2" />
              Barcode
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-8">
        <div className="flex flex-col items-center justify-center">
          {type === 'qr' && qrCode && (
            <div className="mb-6">
              <img src={qrCode} alt="QR Code" className="mx-auto" />
            </div>
          )}
          {type === 'barcode' && barcode && (
            <div className="mb-6">
              <img src={barcode} alt="Barcode" className="mx-auto" />
            </div>
          )}
          <p className="text-sm text-gray-600 mb-4">Order Number: {orderNumber}</p>
          <button
            onClick={handleDownload}
            className="flex items-center px-6 py-3 bg-purple-600 text-white rounded-md hover:bg-purple-700"
          >
            <Download className="h-5 w-5 mr-2" />
            Download {type === 'qr' ? 'QR Code' : 'Barcode'}
          </button>
        </div>
      </div>
    </div>
  );
}



