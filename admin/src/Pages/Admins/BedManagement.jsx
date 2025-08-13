import React, { useContext, useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { AdminContext } from '../../Context/AdminContext';

const BedManagement = () => {
  const { aToken } = useContext(AdminContext);

  const [wards, setWards] = useState([]);
  const [selectedWard, setSelectedWard] = useState(null);
  const [selectedWardNumber, setSelectedWardNumber] = useState(null);
  const [allocatedBeds, setAllocatedBeds] = useState([]);
  const [loadingBeds, setLoadingBeds] = useState(false);
  const [loadingWards, setLoadingWards] = useState(false);

  // New states for cancellation modal
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelBedId, setCancelBedId] = useState(null);

  useEffect(() => {
    fetchWards();
  }, []);

  const fetchWards = async () => {
    setLoadingWards(true);
    try {
      const { data } = await axios.get('http://localhost:4000/api/admin/wards', {
        headers: { aToken },
      });
      setWards(Array.isArray(data) ? data : data.wards || []);
    } catch (error) {
      console.error('Failed to load wards:', error);
      toast.error('Failed to load wards');
    } finally {
      setLoadingWards(false);
    }
  };

  const fetchAllocatedBeds = async () => {
    if (!selectedWard || !selectedWardNumber) return;

    setLoadingBeds(true);
    try {
      const { data } = await axios.get(`http://localhost:4000/api/admin/allocated-beds`, {
        params: {
          wardName: selectedWard.wardName,
          wardNo: selectedWardNumber.wardNo,
        },
        headers: { aToken },
      });

      if (data.success) {
        // Show all beds except discharged or maybe show cancelled too (depends on your need)
        // Here I show all except discharged only
        const activeBeds = data.beds.filter((bed) => bed.status !== 'discharged');
        setAllocatedBeds(activeBeds);
      } else {
        setAllocatedBeds([]);
      }
    } catch (error) {
      console.error('Failed to fetch allocated beds:', error);
      setAllocatedBeds([]);
      toast.error('Failed to fetch allocated beds');
    } finally {
      setLoadingBeds(false);
    }
  };

  useEffect(() => {
    fetchAllocatedBeds();
  }, [selectedWard, selectedWardNumber]);

  const handleConfirm = async (bedId) => {
    try {
      const { data } = await axios.post(
        `http://localhost:4000/api/admin/confirm-bed`,
        { bedId },
        { headers: { aToken } }
      );
      toast.success(data.message);
      fetchAllocatedBeds();
    } catch (error) {
      console.error('Failed to confirm bed:', error);
      toast.error('Failed to confirm bed');
    }
  };

  const handleDischarge = async (bedId) => {
    try {
      const { data } = await axios.post(
        `http://localhost:4000/api/admin/discharge-bed`,
        { bedId },
        { headers: { aToken } }
      );
      toast.success(data.message);
      fetchAllocatedBeds();
    } catch (error) {
      console.error('Failed to discharge bed:', error);
      toast.error('Failed to discharge bed');
    }
  };

  // Open cancel modal with bedId
  const openCancelModal = (bedId) => {
    setCancelBedId(bedId);
    setCancelReason('');
    setShowCancelModal(true);
  };

  const closeCancelModal = () => {
    setShowCancelModal(false);
    setCancelBedId(null);
    setCancelReason('');
  };

  // Submit cancellation with reason
  const handleCancelSubmit = async () => {
    if (!cancelReason.trim()) {
      toast.info('Please enter a reason for cancellation');
      return;
    }

    try {
      const { data } = await axios.post(
        `http://localhost:4000/api/admin/cancel-bed`,
        { bedId: cancelBedId, cancelReason },
        { headers: { aToken } }
      );
      toast.success(data.message);
      fetchAllocatedBeds();
      closeCancelModal();
    } catch (error) {
      console.error('Failed to cancel bed:', error);
      toast.error('Failed to cancel bed');
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-5 font-inter">
      <p className="mb-6 text-2xl font-semibold text-gray-800">Bed Allocations</p>

      <div className="bg-white border p-6 border-gray-300 rounded-lg shadow-md min-h-[60vh] max-h-[80vh] overflow-y-auto">
        {!selectedWard && (
          <>
            {loadingWards ? (
              <p className="text-center py-10 text-gray-500 text-lg">Loading wards...</p>
            ) : wards.length === 0 ? (
              <p className="text-center py-10 text-gray-500 text-lg">No wards available.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {wards.map((ward, idx) => (
                  <div
                    key={ward._id || idx}
                    onClick={() => setSelectedWard(ward)}
                    className="bg-white p-5 rounded-xl shadow-sm hover:shadow-lg cursor-pointer transition-all duration-300 ease-in-out border border-teal-200"
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === 'Enter' && setSelectedWard(ward)}
                  >
                    <h2 className="text-xl font-semibold text-gray-700">{ward.wardName}</h2>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {selectedWard && !selectedWardNumber && (
          <>
            <button
              onClick={() => setSelectedWard(null)}
              className="mb-6 text-teal-600 hover:text-teal-800 transition duration-200 text-base font-medium flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-teal-300 rounded-md px-3 py-1"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Wards
            </button>

            <h2 className="text-2xl font-semibold mb-6 text-gray-700">
              {selectedWard.wardName} - Select Ward Number
            </h2>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {selectedWard.wardNumbers.map((room, idx) => (
                <div
                  key={room.wardNo || idx}
                  onClick={() => setSelectedWardNumber(room)}
                  className="bg-white p-4 rounded-lg shadow-sm cursor-pointer hover:bg-teal-50 hover:shadow-md transition-all duration-300 ease-in-out border border-teal-200 text-center text-lg font-medium text-gray-700"
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && setSelectedWardNumber(room)}
                >
                  Ward {room.wardNo}
                </div>
              ))}
            </div>
          </>
        )}

        {selectedWard && selectedWardNumber && (
          <>
            <button
              onClick={() => setSelectedWardNumber(null)}
              className="mb-6 text-teal-600 hover:text-teal-800 transition duration-200 text-base font-medium flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-teal-300 rounded-md px-3 py-1"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to {selectedWard.wardName}
            </button>

            <h2 className="text-2xl font-semibold mb-6 text-gray-700">
              Ward {selectedWardNumber.wardNo} – Allocated Beds
            </h2>

            {loadingBeds ? (
              <p className="text-center py-10 text-gray-500 text-lg">Loading beds...</p>
            ) : allocatedBeds.length === 0 ? (
              <p className="text-center py-10 text-gray-500 text-lg">No allocated beds found for this ward number.</p>
            ) : (
              <div className="overflow-x-auto rounded-lg border border-teal-200 shadow-sm">
                <table className="min-w-full bg-white divide-y divide-teal-200">
                  <thead className="bg-teal-50">
                    <tr>
                      <th className="py-3 px-4 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Bed No</th>
                      <th className="py-3 px-4 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Patient Name</th>
                      <th className="py-3 px-4 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Email</th>
                      <th className="py-3 px-4 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Phone</th>
                      <th className="py-3 px-4 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Allocated At</th>
                      <th className="py-3 px-4 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-teal-200">
                    {allocatedBeds.map((bed, idx) => (
                      <tr
                        key={bed._id || idx}
                        className="hover:bg-teal-50 transition-colors duration-150"
                      >
                        <td className="py-3 px-4 whitespace-nowrap text-sm text-gray-800">{bed.bedNo}</td>
                        <td className="py-3 px-4 whitespace-nowrap text-sm text-gray-800">{bed.userId?.name || 'N/A'}</td>
                        <td className="py-3 px-4 whitespace-nowrap text-sm text-gray-800">{bed.userId?.email || 'N/A'}</td>
                        <td className="py-3 px-4 whitespace-nowrap text-sm text-gray-800">{bed.userId?.phone_number || 'N/A'}</td>
                        <td className="py-3 px-4 whitespace-nowrap text-sm text-gray-800">
                          {bed.allocationTime ? new Date(bed.allocationTime).toLocaleString() : 'N/A'}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap text-sm text-gray-800">
                          <div className="flex gap-2 flex-wrap">
                            {bed.status === 'discharged' ? (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                Discharged
                              </span>
                            ) : bed.status === 'cancelled' ? (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                Cancelled
                              </span>
                            ) : bed.isAdmitted ? (
                              <button
                                onClick={() => handleDischarge(bed._id)}
                                className="bg-teal-600 text-white px-3 py-1.5 rounded-md hover:bg-teal-700 transition-colors duration-200 text-xs font-medium shadow-sm"
                              >
                                Discharge Patient
                              </button>
                            ) : (
                              <>
                                <button
                                  onClick={() => handleConfirm(bed._id)}
                                  className="bg-teal-600 text-white px-3 py-1.5 rounded-md hover:bg-teal-700 transition-colors duration-200 text-xs font-medium shadow-sm"
                                >
                                  Confirm
                                </button>
                                <button
                                  onClick={() => openCancelModal(bed._id)}
                                  className="bg-red-600 text-white px-3 py-1.5 rounded-md hover:bg-red-700 transition-colors duration-200 text-xs font-medium shadow-sm"
                                >
                                  Cancel
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        {showCancelModal && (
  <div
    className="fixed inset-0 flex justify-center items-center z-50"
    style={{
      backdropFilter: 'blur(4px)',  // Adjust the blur px as needed (e.g. 3px, 5px)
      WebkitBackdropFilter: 'blur(4px)', // for Safari support
      backgroundColor: 'rgba(255, 255, 255, 0.1)', // very subtle white tint, optional
    }}
  >
    <div className="bg-white p-6 rounded-lg shadow-lg w-11/12 max-w-md">
      <h3 className="text-xl font-semibold mb-4 text-gray-800">Cancel Bed Allocation</h3>
      <label htmlFor="cancelReason" className="block mb-2 font-medium text-gray-700">
        Reason for Cancellation
      </label>
      <textarea
        id="cancelReason"
        value={cancelReason}
        onChange={(e) => setCancelReason(e.target.value)}
        rows={4}
        className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-400"
        placeholder="Enter reason here..."
      />
      <div className="mt-4 flex justify-end gap-4">
        <button
          onClick={closeCancelModal}
          className="px-4 py-2 rounded-md border border-gray-300 hover:bg-gray-100 transition"
        >
          Cancel
        </button>
        <button
          onClick={handleCancelSubmit}
          className="px-4 py-2 rounded-md bg-red-600 text-white hover:bg-red-700 transition"
        >
          Submit
        </button>
      </div>
    </div>
  </div>
)}

      </div>
    </div>
  );
};

export default BedManagement;
