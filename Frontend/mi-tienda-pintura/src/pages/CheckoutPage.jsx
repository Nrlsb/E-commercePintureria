// Frontend/mi-tienda-pintura/src/pages/CheckoutPage.jsx
import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { CardPayment, initMercadoPago } from '@mercadopago/sdk-react';
import { useCartStore } from '../stores/useCartStore';
import { useAuthStore } from '../stores/useAuthStore';
import { useNotificationStore } from '../stores/useNotificationStore';
import { usePayment } from '../hooks/usePayment';
import Spinner from '../components/Spinner.jsx';
import { Link, useNavigate } from 'react-router-dom';
import { fetchWithCsrf } from '../api/api';
import Icon from '../components/Icon';
import CheckoutStepper from '../components/CheckoutStepper';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';
const MIN_TRANSACTION_AMOUNT = 100;
const MERCADOPAGO_PUBLIC_KEY = import.meta.env.VITE_MERCADOPAGO_PUBLIC_KEY;
const PAYWAY_PUBLIC_KEY = import.meta.env.VITE_PAYWAY_PUBLIC_KEY;

if (MERCADOPAGO_PUBLIC_KEY) {
  initMercadoPago(MERCADOPAGO_PUBLIC_KEY, { locale: 'es-AR' });
}

// --- Componente para el Paso 1: Dirección ---
const AddressStep = ({ onAddressSelect, selectedAddressId, token }) => {
    const [addresses, setAddresses] = useState([]);
    const [loading, setLoading] = useState(true);
    const showNotification = useNotificationStore(state => state.showNotification);

    useEffect(() => {
        const fetchAddresses = async () => {
            try {
                const response = await fetchWithCsrf(`${API_URL}/api/user/addresses`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (!response.ok) throw new Error('No se pudieron cargar las direcciones.');
                const data = await response.json();
                setAddresses(data);
                if (data.length > 0 && !selectedAddressId) {
                    const defaultAddress = data.find(addr => addr.is_default) || data[0];
                    onAddressSelect(defaultAddress.id);
                }
            } catch (err) {
                showNotification(err.message, 'error');
            } finally {
                setLoading(false);
            }
        };
        fetchAddresses();
    }, [token, showNotification, onAddressSelect, selectedAddressId]);

    if (loading) {
        return <div className="flex justify-center items-center p-8"><Spinner /></div>;
    }

    return (
        <div>
            <h2 className="text-xl font-bold mb-4">1. Dirección de Envío</h2>
            {addresses.length === 0 ? (
                <div className="text-center p-6 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-yellow-700">No tienes direcciones guardadas.</p>
                    <Link to="/profile" className="font-bold text-blue-600 hover:underline mt-2 inline-block">
                        Agregar una dirección en tu perfil
                    </Link>
                </div>
            ) : (
                <div className="space-y-4">
                    {addresses.map(addr => (
                        <div
                            key={addr.id}
                            onClick={() => onAddressSelect(addr.id)}
                            className={`border p-4 rounded-lg cursor-pointer transition-all ${selectedAddressId === addr.id ? 'border-blue-500 ring-2 ring-blue-500' : 'border-gray-300 hover:border-gray-400'}`}
                        >
                            <p className="font-semibold">{addr.address_line1}, {addr.address_line2}</p>
                            <p className="text-sm text-gray-600">{addr.city}, {addr.state}, {addr.postal_code}</p>
                            {addr.is_default && <span className="text-xs font-bold text-green-600 bg-green-100 px-2 py-1 rounded-full mt-2 inline-block">Predeterminada</span>}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

// --- Componente para el Paso 2: Envío ---
const ShippingStep = ({ onShippingSelect, selectedMethod }) => {
    // En una aplicación real, estas opciones vendrían del backend
    const shippingOptions = [
        { id: 'standard', name: 'Envío Estándar', time: '3-5 días hábiles', cost: 1500 },
        { id: 'express', name: 'Envío Express', time: '1-2 días hábiles', cost: 2500 },
        { id: 'pickup', name: 'Retiro en Tienda', time: '24hs hábiles', cost: 0 },
    ];

    return (
        <div>
            <h2 className="text-xl font-bold mb-4">2. Método de Envío</h2>
            <div className="space-y-4">
                {shippingOptions.map(option => (
                    <div
                        key={option.id}
                        onClick={() => onShippingSelect(option)}
                        className={`border p-4 rounded-lg cursor-pointer transition-all ${selectedMethod?.id === option.id ? 'border-blue-500 ring-2 ring-blue-500' : 'border-gray-300 hover:border-gray-400'}`}
                    >
                        <div className="flex justify-between items-center">
                            <div>
                                <p className="font-semibold">{option.name}</p>
                                <p className="text-sm text-gray-600">{option.time}</p>
                            </div>
                            <p className="font-bold text-lg">{option.cost > 0 ? `$${new Intl.NumberFormat('es-AR').format(option.cost)}` : 'Gratis'}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

// --- Componente para el Paso 3: Pago (ACTUALIZADO) ---
const PaymentStep = ({ total, user }) => {
    const [paymentMethod, setPaymentMethod] = useState('mercado_pago');
    const { isProcessing, error, submitCardPayment, submitPixPayment, submitPaywayPayment, setError } = usePayment();
    const showNotification = useNotificationStore(state => state.showNotification);
    
    const [paywayToken, setPaywayToken] = useState(null);

    useEffect(() => {
        if (paymentMethod === 'payway' && window.Decidir) {
            try {
                const decidir = new window.Decidir(config.payway.apiUrl, true);
                decidir.setPublishableKey(PAYWAY_PUBLIC_KEY);
                decidir.createToken('card_form', (status, response) => {
                    if (status !== 200 && status !== 201) {
                        setError(response.message || 'Error al tokenizar la tarjeta.');
                    } else {
                        setPaywayToken(response.id);
                        submitPaywayPayment(response.id);
                    }
                });
            } catch (e) {
                console.error("Error inicializando Payway:", e);
                setError("No se pudo cargar el formulario de pago de Payway.");
            }
        }
    }, [paymentMethod, setError, submitPaywayPayment]);

    const handlePaywaySubmit = (e) => {
        e.preventDefault();
        if (!isProcessing) {
            // La lógica de tokenización se dispara en el useEffect
        }
    };

    const initialization = { amount: total, payer: { email: user?.email } };
    const customization = {
        visual: { style: { theme: 'bootstrap' } },
        paymentMethods: { maxInstallments: 6 },
    };

    const handleOnError = (err) => {
        console.error('Error en el brick de pago:', err);
        let friendlyMessage = 'Error en el formulario de pago. Por favor, revisa los datos ingresados.';
        if (err.message?.includes('fields_setup_failed')) {
            friendlyMessage = 'No se pudo cargar el formulario de pago. Por favor, recarga la página.';
        } else if (err.message?.includes('empty_installments') || err.message?.includes('higher amount')) {
            friendlyMessage = 'No hay cuotas disponibles para este monto o tarjeta. El monto puede ser muy bajo.';
        }
        setError(friendlyMessage);
        showNotification(friendlyMessage, 'error');
    };

    return (
        <div>
            <Helmet>
                <script src="https://live.decidir.com/static/v2.5/decidir.js" type="text/javascript"></script>
            </Helmet>

            <h2 className="text-xl font-bold mb-4">3. Método de Pago</h2>
            <div className="flex space-x-4 mb-8 border-b pb-6">
                <button onClick={() => setPaymentMethod('mercado_pago')} className={`px-6 py-3 rounded-lg font-semibold transition-all ${paymentMethod === 'mercado_pago' ? 'bg-[#0F3460] text-white shadow-lg' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>
                    Mercado Pago
                </button>
                <button onClick={() => setPaymentMethod('payway')} className={`px-6 py-3 rounded-lg font-semibold transition-all ${paymentMethod === 'payway' ? 'bg-[#0F3460] text-white shadow-lg' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>
                    Tarjeta (Payway)
                </button>
                <button onClick={() => setPaymentMethod('pix_transfer')} className={`px-6 py-3 rounded-lg font-semibold transition-all ${paymentMethod === 'pix_transfer' ? 'bg-[#0F3460] text-white shadow-lg' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>
                    Transferencia / PIX
                </button>
            </div>

            {paymentMethod === 'mercado_pago' && (
                <div>
                    {total < MIN_TRANSACTION_AMOUNT ? (
                        <div className="text-center p-6 bg-yellow-50 border border-yellow-200 rounded-lg">
                            <h3 className="text-xl font-semibold text-yellow-800">Monto mínimo no alcanzado</h3>
                            <p className="text-yellow-700 mt-2">El total de tu compra debe ser de al menos ${MIN_TRANSACTION_AMOUNT} para pagar con este método.</p>
                        </div>
                    ) : (
                        <CardPayment
                            initialization={initialization}
                            customization={customization}
                            onSubmit={submitCardPayment}
                            onError={handleOnError}
                        />
                    )}
                </div>
            )}

            {paymentMethod === 'payway' && (
                <div>
                    <h3 className="text-xl font-bold mb-4">Pagar con Tarjeta de Crédito/Débito</h3>
                    <form id="card_form" onSubmit={handlePaywaySubmit}>
                        <div className="space-y-4">
                            <input type="text" data-decidir="card_holder_name" placeholder="Nombre como figura en la tarjeta" className="w-full p-2 border rounded"/>
                            <input type="text" data-decidir="card_number" placeholder="Número de la tarjeta" className="w-full p-2 border rounded"/>
                            <div className="flex space-x-4">
                                <input type="text" data-decidir="card_expiration_month" placeholder="Mes (MM)" className="w-1/2 p-2 border rounded"/>
                                <input type="text" data-decidir="card_expiration_year" placeholder="Año (YY)" className="w-1/2 p-2 border rounded"/>
                            </div>
                            <input type="text" data-decidir="security_code" placeholder="Código de seguridad" className="w-full p-2 border rounded"/>
                            <select data-decidir="card_holder_doc_type" className="w-full p-2 border rounded">
                                <option value="dni">DNI</option>
                            </select>
                            <input type="text" data-decidir="card_holder_doc_number" placeholder="Número de documento" className="w-full p-2 border rounded"/>
                        </div>
                        <button
                            type="submit"
                            disabled={isProcessing}
                            className="w-full mt-6 bg-[#0F3460] text-white font-bold py-3 rounded-lg hover:bg-[#1a4a8a] transition-colors disabled:bg-gray-400 flex items-center justify-center"
                        >
                            {isProcessing ? <Spinner /> : `Pagar $${new Intl.NumberFormat('es-AR').format(total)}`}
                        </button>
                    </form>
                </div>
            )}

            {paymentMethod === 'pix_transfer' && (
                <div>
                    <h3 className="text-xl font-bold mb-4">Pagar con Transferencia / PIX</h3>
                    <p className="text-gray-600 mb-6">Al confirmar, te mostraremos los datos para que realices el pago desde tu home banking o billetera virtual. La confirmación es automática.</p>
                    {!user?.dni ? (
                        <div className="p-4 bg-red-50 border-l-4 border-red-400 text-red-700">
                            <p className="font-bold">DNI Requerido</p>
                            <p>Para continuar, por favor agrega tu DNI en tu perfil. Es un requisito de Mercado Pago para este método de pago.</p>
                            <Link to="/profile" className="font-bold underline hover:text-red-800">Ir a Mi Perfil</Link>
                        </div>
                    ) : (
                         <button
                            onClick={submitPixPayment}
                            disabled={isProcessing}
                            className="w-full mt-6 bg-[#0F3460] text-white font-bold py-3 rounded-lg hover:bg-[#1a4a8a] transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center"
                        >
                            {isProcessing ? <Spinner /> : 'Generar datos para el pago'}
                        </button>
                    )}
                </div>
            )}

            {error && <p className="text-red-500 text-sm mt-4 text-center">{error}</p>}
            {isProcessing && (
                <div className="flex justify-center items-center mt-4"><Spinner className="w-8 h-8 text-[#0F3460] mr-2" /><span>Procesando...</span></div>
            )}
        </div>
    );
};

// --- Componente Principal de la Página de Checkout ---
const CheckoutPage = () => {
    const [step, setStep] = useState(0);
    const [selectedAddressId, setSelectedAddressId] = useState(null);
    const [selectedShippingMethod, setSelectedShippingMethod] = useState(null);

    const { cart, discountAmount, appliedCoupon, setShippingCost } = useCartStore(state => ({
        cart: state.cart,
        discountAmount: state.discountAmount,
        appliedCoupon: state.appliedCoupon,
        setShippingCost: state.setShippingCost,
    }));
    const { user, token } = useAuthStore();
    const navigate = useNavigate();
    const { isProcessing } = usePayment();

    const subtotal = cart.reduce((total, item) => total + item.price * item.quantity, 0);
    const total = (subtotal - discountAmount) + (selectedShippingMethod?.cost || 0);

    useEffect(() => {
        if (cart.length === 0 && !isProcessing) {
            navigate('/cart');
        }
    }, [cart, navigate, isProcessing]);
    
    const handleShippingSelect = (method) => {
        setSelectedShippingMethod(method);
        setShippingCost(method.cost);
    };

    const handleNextStep = () => {
        if (step === 0 && !selectedAddressId) {
            useNotificationStore.getState().showNotification('Por favor, selecciona una dirección de envío.', 'error');
            return;
        }
        if (step === 1 && !selectedShippingMethod) {
            useNotificationStore.getState().showNotification('Por favor, selecciona un método de envío.', 'error');
            return;
        }
        setStep(prev => prev + 1);
    };

    const handlePrevStep = () => setStep(prev => prev - 1);

    const getCartItemImageUrl = (item) => {
        if (item.imageUrl && typeof item.imageUrl === 'object') {
            return item.imageUrl.small || item.imageUrl.medium;
        }
        return item.imageUrl || `https://placehold.co/100x100/cccccc/ffffff?text=Img`;
    };

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="max-w-2xl mx-auto mb-12">
                <CheckoutStepper currentStep={step} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                <div className="lg:col-span-2 bg-white p-8 rounded-lg shadow-md">
                    {step === 0 && <AddressStep onAddressSelect={setSelectedAddressId} selectedAddressId={selectedAddressId} token={token} />}
                    {step === 1 && <ShippingStep onShippingSelect={handleShippingSelect} selectedMethod={selectedShippingMethod} />}
                    {step === 2 && <PaymentStep total={total} user={user} />}
                    
                    <div className="flex justify-between mt-8 pt-6 border-t">
                        {step > 0 && (
                            <button onClick={handlePrevStep} className="px-6 py-2 bg-gray-200 text-gray-800 font-semibold rounded-lg hover:bg-gray-300">
                                Volver
                            </button>
                        )}
                        {step < 2 && (
                            <button onClick={handleNextStep} className="px-6 py-2 bg-[#0F3460] text-white font-semibold rounded-lg hover:bg-[#1a4a8a] ml-auto">
                                Continuar
                            </button>
                        )}
                    </div>
                </div>

                <div className="lg:col-span-1">
                    <div className="bg-white p-6 rounded-lg shadow-md sticky top-28">
                        <h2 className="text-2xl font-bold border-b pb-4 mb-4">Tu Pedido</h2>
                        <div className="space-y-4 mb-6 max-h-64 overflow-y-auto">
                            {cart.map(item => (
                                <div key={item.id} className="flex justify-between items-center">
                                    <div className="flex items-center">
                                        <img src={getCartItemImageUrl(item)} alt={item.name} className="w-16 h-16 rounded-md mr-3" />
                                        <div><p className="font-semibold">{item.name}</p><p className="text-sm text-gray-500">Cant: {item.quantity}</p></div>
                                    </div>
                                    <p className="font-semibold">${new Intl.NumberFormat('es-AR').format(item.price * item.quantity)}</p>
                                </div>
                            ))}
                        </div>
                        <div className="border-t pt-4 space-y-2">
                            <div className="flex justify-between text-lg"><span>Subtotal</span><span>${new Intl.NumberFormat('es-AR').format(subtotal)}</span></div>
                            {appliedCoupon && (
                                <div className="flex justify-between text-lg text-green-600">
                                    <span>Descuento ({appliedCoupon.code})</span>
                                    <span>- ${new Intl.NumberFormat('es-AR').format(discountAmount)}</span>
                                </div>
                            )}
                            <div className="flex justify-between text-lg">
                                <span>Envío</span>
                                <span>{selectedShippingMethod ? `$${new Intl.NumberFormat('es-AR').format(selectedShippingMethod.cost)}` : 'A calcular'}</span>
                            </div>
                            <div className="flex justify-between font-bold text-2xl">
                                <span>Total</span>
                                <span>${new Intl.NumberFormat('es-AR').format(total)}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CheckoutPage;
