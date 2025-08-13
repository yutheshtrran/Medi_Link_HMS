import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

const backendUrl = "http://localhost:4000"; // Your backend URL

const Donation = () => {
    // State for countries, selected country, currency, amount, email, message, flag, and UI status
    const [countries, setCountries] = useState([]);
    const [selectedCountryName, setSelectedCountryName] = useState('');
    const [selectedCurrency, setSelectedCurrency] = useState({ code: 'USD', symbol: '$' });
    const [selectedAmount, setSelectedAmount] = useState(0);
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [flagUrl, setFlagUrl] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    // Fetch countries on component mount
    useEffect(() => {
        const loadCountries = async () => {
            try {
                const { data } = await axios.get('https://restcountries.com/v3.1/all?fields=name,currencies,flags');
                const processedCountries = data
                    .map(country => {
                        const currencyKey = Object.keys(country.currencies || {})[0];
                        return {
                            name: country.name.common,
                            currencyCode: currencyKey || 'LKR',
                            currencySymbol: country.currencies?.[currencyKey]?.symbol || 'Rs',
                            flag: country.flags?.svg || ''
                        };
                    })
                    .sort((a, b) => a.name.localeCompare(b.name));

                setCountries(processedCountries);
                // Set default to United States or the first available country
                const defaultCountry = processedCountries.find(c => c.name === 'United States') || processedCountries[0];
                if (defaultCountry) {
                    setSelectedCountryName(defaultCountry.name);
                    setSelectedCurrency({ code: defaultCountry.currencyCode, symbol: defaultCountry.currencySymbol });
                    setFlagUrl(defaultCountry.flag);
                }
            } catch (err) {
                console.error("Failed to load countries:", err);
                setError("Failed to load country data.");
                toast.error("Error loading countries.");
            } finally {
                setIsLoading(false);
            }
        };
        loadCountries();
    }, []);

    // Update currency and flag when country selection changes
    useEffect(() => {
        const country = countries.find(c => c.name === selectedCountryName);
        if (country) {
            setSelectedCurrency({ code: country.currencyCode, symbol: country.currencySymbol });
            setFlagUrl(country.flag);
        }
    }, [selectedCountryName, countries]);

    // Handle the donation submission
    const handleDonate = async () => {
        if (!selectedAmount || !selectedCountryName) {
            toast.error("Please enter a donation amount and select a country.");
            return;
        }

        try {
            const { data } = await axios.post(`${backendUrl}/api/donation/create-checkout-session`, {
                amount: selectedAmount,
                currency: selectedCurrency.code.toLowerCase(),
                email,
                message,
            }, {
                headers: { token: localStorage.getItem('token') }
            });

            if (data.success) {
                window.location.href = data.url; // Redirect to Stripe checkout
            } else {
                toast.error(data.message || "Failed to initiate donation.");
            }
        } catch (err) {
            console.error("Donation error:", err);
            toast.error("Something went wrong. Please try again.");
        }
    };

    if (isLoading) return <div className="text-center mt-20 text-xl">Loading countries...</div>;
    if (error) return <div className="text-red-600 text-center mt-20">{error}</div>;

    return (
        <div className="max-w-xl mx-auto mt-10 p-6 bg-white shadow-xl rounded-2xl">
            <h2 className="text-3xl font-bold text-center text-gray-800 mb-4">Support a Life, Your Way</h2>

            {/* Total Impact Display */}
            <div className="text-center text-[#0d9182] font-extrabold text-2xl bg-[#e1f5f2] border border-[#b0e5dd] py-3 rounded-xl mb-6">
                Total Impact: {selectedCurrency.symbol} {selectedAmount || 0}
            </div>

            {/* Country Selection */}
            <div className="mb-6 flex items-center space-x-3">
                <label htmlFor="countrySelect" className="text-lg font-medium text-gray-700">Country:</label>
                {flagUrl && <img src={flagUrl} alt="Flag" className="w-8 h-6 rounded-md border" />}
                <select
                    id="countrySelect"
                    value={selectedCountryName}
                    onChange={(e) => setSelectedCountryName(e.target.value)}
                    className="w-48 px-4 py-2 border border-gray-300 rounded-lg shadow-sm text-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#0d9182]"
                >
                    <option value="">Select</option>
                    {countries.map(country => (
                        <option key={country.name} value={country.name}>
                            {country.name} ({country.currencySymbol})
                        </option>
                    ))}
                </select>
            </div>

            {/* Donation Amount Input */}
            <div className="mb-6">
                <label className="block text-lg font-medium text-gray-700 mb-2">Enter Donation Amount:</label>
                <div className="flex items-center gap-2">
                    <span className="px-4 py-3 bg-gray-100 border-2 border-gray-300 rounded-xl text-xl font-bold">{selectedCurrency.symbol}</span>
                    <input
                        type="number"
                        placeholder="Enter amount"
                        value={selectedAmount}
                        onChange={(e) => setSelectedAmount(Number(e.target.value))}
                        className="flex-grow px-4 py-3 border-2 border-gray-300 rounded-xl text-xl focus:outline-none focus:ring-2 focus:ring-[#0d9182]"
                    />
                </div>
            </div>

            {/* Optional Email Input */}
            <div className="mb-6">
                <label className="block text-lg font-medium text-gray-700 mb-2">Your Email (optional):</label>
                <input
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl text-lg focus:outline-none focus:ring-2 focus:ring-[#0d9182]"
                />
            </div>

            {/* Optional Message Textarea */}
            <div className="mb-8">
                <label className="block text-lg font-medium text-gray-700 mb-2">Message (optional):</label>
                <textarea
                    rows="3"
                    placeholder="Leave a kind note..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl text-lg resize-y focus:outline-none focus:ring-2 focus:ring-[#0d9182]"
                />
            </div>

            {/* Donate Button */}
            <button
                onClick={handleDonate}
                disabled={!selectedAmount || !selectedCountryName}
                className={`w-full py-4 rounded-xl text-2xl font-bold transition hover:scale-105 duration-300 ${
                    selectedAmount && selectedCountryName
                        ? 'bg-[#0d9182] hover:bg-[#0b7b6d] text-white'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
            >
                Donate {selectedCurrency.symbol} {selectedAmount || 0} Now
            </button>
        </div>
    );
};

export default Donation;