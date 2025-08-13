import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import jsPDF from 'jspdf';
import { toast } from 'react-toastify';

const DonationSuccess = () => {
  const location = useLocation();

  const query = new URLSearchParams(location.search);
  const name = query.get('name') || 'Anonymous Donor';
  const amount = query.get('amount') || 'Unknown';
  const email = query.get('email') || 'Not Provided';
  const message = query.get('message') || 'No message';

  useEffect(() => {
    toast.success("Thank you! Your donation was successful.", { autoClose: 3000 });

    const saveDonation = async () => {
      try {
        const response = await fetch("http://localhost:4000/api/donation/record", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            token: localStorage.getItem("token"),
          },
          body: JSON.stringify({
            userId: localStorage.getItem("userId"),
            amount,
            email,
            message,
          }),
        });

        const result = await response.json();
        if (!result.success) {
          toast.error("Donation was not saved to the database!");
        }
      } catch (error) {
        console.error("Saving donation failed:", error);
        toast.error("Server error while saving donation.");
      }
    };

    saveDonation();
  }, [amount, email, message]);

  const downloadReceipt = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("Donation Receipt", 70, 20);
    doc.setFontSize(12);
    doc.text(`Donor Name: ${name}`, 20, 40);
    doc.text(`Email: ${email}`, 20, 50);
    doc.text(`Amount Donated: රු ${amount}`, 20, 60);
    doc.text(`Message: ${message}`, 20, 70);
    doc.text("Thank you for your generous support!", 20, 90);
    doc.save("donation_receipt.pdf");
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white shadow-lg rounded-lg mt-10">
      <h2 className="text-2xl font-bold text-[#0d9182] mb-4 text-center">Donation Successful!</h2>

      <div className="bg-[#e1f5f2] border border-[#b0e5dd] rounded-md p-5 text-gray-800 space-y-3">
        <p><strong>Donor Name:</strong> {name}</p>
        <p><strong>Email:</strong> {email}</p>
        <p><strong>Amount Donated:</strong> රු {amount}</p>
        <p><strong>Message:</strong> {message}</p>
      </div>

      <div className="mt-6 text-center">
        <button
          onClick={downloadReceipt}
          className="bg-[#0d9182] text-white px-6 py-2 rounded hover:bg-[#0b7b6d] transition"
        >
          Download Receipt
        </button>
      </div>
    </div>
  );
};

export default DonationSuccess;
