import React, { useState } from 'react';
import { MOCK_PRODUCTS, MACRO_YETU } from '../constants';
import { Product } from '../types';
import { useNavigate } from 'react-router-dom';

const GlobalShop: React.FC = () => {
  const navigate = useNavigate();
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  
  // Form State
  const [recipientName, setRecipientName] = useState('');
  const [recipientContact, setRecipientContact] = useState('');
  const [recipientAddress, setRecipientAddress] = useState('');
  const [notes, setNotes] = useState('');

  const handleBuy = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;

    // Strict WhatsApp Template for Global Shop
    const text = `Olá Macro Yetu! 👋
Quero encomendar um presente pelo App KAMBA OCULTO! 🎁

🛍 Produto: ${selectedProduct.name}
💰 Valor: ${selectedProduct.price} ${selectedProduct.currency}

👤 Para: ${recipientName}
📱 Contacto: ${recipientContact}
📍 Endereço: ${recipientAddress}

📝 Minhas Observações: ${notes || 'Nenhuma'}

Aguardo confirmação do pagamento!`;

    const url = `https://wa.me/${MACRO_YETU.phones[0]}?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
    setSelectedProduct(null);
  };

  return (
    <div className="pb-20">
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => navigate('/dashboard')} className="text-gray-500 hover:text-gray-800">← Voltar</button>
        <h1 className="text-2xl font-bold text-[#C62828]">Loja Global 🛍️</h1>
      </div>

      {/* Supplier Profile Card */}
      <div className="bg-white border-l-4 border-[#D4AF37] rounded-r-lg shadow-sm p-4 mb-6 flex flex-col md:flex-row md:items-center gap-4">
        <div className="bg-[#FFF8E1] p-3 rounded-full w-12 h-12 flex items-center justify-center text-2xl border border-[#D4AF37]">
          🏢
        </div>
        <div>
          <h3 className="font-bold text-gray-800 text-lg">Fornecedor Oficial: {MACRO_YETU.name}</h3>
          <p className="text-sm text-gray-600 mt-1">📍 {MACRO_YETU.address}</p>
          <div className="flex gap-3 mt-1 text-sm font-bold text-[#2E7D32]">
             {MACRO_YETU.phones.map(phone => (
               <span key={phone}>📞 {phone}</span>
             ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {MOCK_PRODUCTS.map(p => (
          <div key={p.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
            <img src={p.image} alt={p.name} className="w-full h-48 object-cover bg-gray-200" />
            <div className="p-4 flex-1 flex flex-col">
              <h3 className="font-bold text-gray-800">{p.name}</h3>
              <p className="text-gray-500 text-xs mb-2">{p.category}</p>
              <div className="mt-auto flex justify-between items-center">
                <span className="text-[#C62828] font-black text-lg">{p.price.toLocaleString()} Kz</span>
                <button 
                  onClick={() => setSelectedProduct(p)}
                  className="bg-[#2E7D32] text-white px-4 py-2 rounded-lg font-bold text-sm hover:bg-green-700 transition"
                >
                  Comprar
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Order Form - Fixed Position to follow screen */}
      {selectedProduct && (
        <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white w-full max-w-lg rounded-t-2xl md:rounded-2xl p-6 relative max-h-[90vh] overflow-y-auto shadow-2xl animate-slide-up">
             <button onClick={() => setSelectedProduct(null)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-800 text-xl">✕</button>
             
             <div className="mb-4 border-b pb-2">
                <h2 className="text-xl font-bold text-[#2E7D32]">Confirmar Encomenda</h2>
                <p className="text-sm text-gray-500">{selectedProduct.name} - <span className="font-bold text-[#C62828]">{selectedProduct.price} Kz</span></p>
             </div>

             <form onSubmit={handleBuy} className="space-y-3">
                <div>
                   <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Para quem é?</label>
                   <input required value={recipientName} onChange={e => setRecipientName(e.target.value)} className="w-full bg-[#FFF8E1] border border-gray-200 rounded-lg p-3 text-sm text-gray-900" placeholder="Nome do Destinatário" />
                </div>
                <div>
                   <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Contacto do Destinatário</label>
                   <input required value={recipientContact} onChange={e => setRecipientContact(e.target.value)} className="w-full bg-[#FFF8E1] border border-gray-200 rounded-lg p-3 text-sm text-gray-900" placeholder="9xx xxx xxx" />
                </div>
                <div>
                   <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Endereço de Entrega</label>
                   <textarea required value={recipientAddress} onChange={e => setRecipientAddress(e.target.value)} className="w-full bg-[#FFF8E1] border border-gray-200 rounded-lg p-3 text-sm text-gray-900" placeholder="Município, Bairro, Rua, Ponto de ref..." rows={2} />
                </div>
                <div>
                   <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Observações</label>
                   <textarea value={notes} onChange={e => setNotes(e.target.value)} className="w-full bg-[#FFF8E1] border border-gray-200 rounded-lg p-3 text-sm text-gray-900" placeholder="Escreve uma mensagem..." rows={2} />
                </div>

                <button type="submit" className="w-full bg-[#25D366] text-white font-bold py-3 rounded-lg shadow mt-2 hover:bg-green-600 flex items-center justify-center gap-2">
                  <span>Finalizar no WhatsApp</span>
                  <span>💬</span>
                </button>
             </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default GlobalShop;
