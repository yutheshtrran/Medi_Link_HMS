import React, { useContext, useEffect, useState } from 'react';
import { assets } from '../../assets/assets';
import axios from 'axios';
import { toast } from 'react-toastify';
import { AdminContext } from '../../Context/AdminContext';

const AddWard = () => {
  const { aToken } = useContext(AdminContext);

  const [wardName, setWardName] = useState('');
  const [wardCategory, setWardCategory] = useState('');
  const [features, setFeatures] = useState([]);
  const [rooms, setRooms] = useState([{ wardNo: 1, beds: 10 }]);
  const [view, setView] = useState('add');
  const [wardList, setWardList] = useState([]);
  const [editWard, setEditWard] = useState(null); // Track if we're editing

  const availableFeatures = ['AC', 'TV', 'Oxygen Supply', 'Ventilator', 'Attached Bathroom'];

  const toggleFeature = (feature) => {
    setFeatures((prev) =>
      prev.includes(feature) ? prev.filter((f) => f !== feature) : [...prev, feature]
    );
  };

  const addRoom = () => {
    setRooms([...rooms, { wardNo: rooms.length + 1, beds: 10 }]);
  };

  const updateRoom = (index, key, value) => {
    const updatedRooms = [...rooms];
    updatedRooms[index][key] = parseInt(value) || 0;
    setRooms(updatedRooms);
  };

  const removeRoom = (index) => {
    const updatedRooms = rooms.filter((_, i) => i !== index);
    setRooms(updatedRooms);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!wardName.trim()) return toast.error('Please enter a ward name');
    if (!wardCategory.trim()) return toast.error('Please select a ward category');
    if (rooms.length === 0) return toast.error('Add at least one room');

    const payload = {
      wardName,
      wardCategory,
      wardNumbers: rooms,
      features,
    };

    const url = editWard
      ? `http://localhost:4000/api/admin/ward/${editWard._id}`
      : 'http://localhost:4000/api/admin/ward';
    const method = editWard ? 'put' : 'post';

    try {
      const response = await axios[method](url, payload, { headers: { aToken } });

      if (response.status === 200 || response.status === 201) {
        toast.success(response.data.message || 'Ward saved successfully!');
        resetForm();
        fetchWards();
      } else {
        toast.error(response.data.message || 'Unexpected response from server.');
      }
    } catch (error) {
      console.error('Error saving ward:', error);
      toast.error(error.response?.data?.message || 'Server error. Please try again.');
    }
  };

  const resetForm = () => {
    setWardName('');
    setWardCategory('');
    setRooms([{ wardNo: 1, beds: 10 }]);
    setFeatures([]);
    setEditWard(null);
  };

  const fetchWards = async () => {
    try {
      const { data } = await axios.get('http://localhost:4000/api/admin/wards', {
        headers: { aToken },
      });
      if (Array.isArray(data)) {
        setWardList(data);
      } else {
        setWardList([]);
        console.error('Expected an array, got:', typeof data);
      }
    } catch (error) {
      console.error('Error fetching wards:', error);
      setWardList([]);
    }
  };

  const startEditing = (ward) => {
    setEditWard(ward);
    setWardName(ward.wardName);
    setWardCategory(ward.wardCategory || '');
    setFeatures(ward.features || []);
    setRooms(ward.wardNumbers || []);
    setView('add');
  };

  useEffect(() => {
    fetchWards();
  }, []);

  return (
    <div className="m-5 w-full">
      <p className="mb-3 text-lg font-medium text-teal-700">Ward Management</p>

      <div className="bg-white p-4 border my-4 border-gray-300 rounded flex justify-center flex-col md:flex-row items-center gap-4 max-w-4xl mx-auto">
        <button
          onClick={() => {
            resetForm();
            setView('add');
          }}
          className={`px-8 py-2 rounded-md text-white cursor-pointer transition-colors duration-200 ${
            view === 'add' ? 'bg-teal-700' : 'bg-teal-500 hover:bg-teal-600'
          }`}
        >
          {editWard ? 'Edit Ward' : 'Add Ward'}
        </button>
        <button
          onClick={() => {
            setView('manage');
            resetForm();
          }}
          className={`px-8 py-2 rounded-md text-white cursor-pointer transition-colors duration-200 ${
            view === 'manage' ? 'bg-teal-700' : 'bg-teal-500 hover:bg-teal-600'
          }`}
        >
          Ward Management
        </button>
      </div>

      {view === 'add' ? (
        <form
          onSubmit={handleSubmit}
          className="bg-white border border-gray-300 px-8 py-8 rounded w-full max-w-4xl mx-auto"
        >
          <div className="w-full flex flex-col gap-6 md:gap-0">
            <div className="flex flex-col md:grid md:grid-cols-2 gap-4 w-full">
              <div className="w-full flex flex-col gap-2">
                <label htmlFor="ward-name" className="font-semibold text-gray-700">
                  Ward Name
                </label>
                <input
                  type="text"
                  value={wardName}
                  onChange={(e) => setWardName(e.target.value)}
                  className="w-full p-2 border border-teal-400 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                  placeholder="Ward name"
                  id="ward-name"
                  required
                />
              </div>

              <div className="w-full flex flex-col gap-2">
                <label htmlFor="ward-category" className="font-semibold text-gray-700">
                  Ward Category
                </label>
                <select
                  value={wardCategory}
                  onChange={(e) => setWardCategory(e.target.value)}
                  className="w-full p-2 border border-teal-400 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                  id="ward-category"
                  required
                >
                  <option value="">Select Category</option>
                  <option value="General">General</option>
                  <option value="Pediatric">Pediatric</option>
                  <option value="Maternity">Maternity</option>
                  <option value="ICU">ICU</option>
                  <option value="Surgical">Surgical</option>
                </select>
              </div>

              <div className="w-full flex flex-col gap-2 col-span-2">
                <label className="font-semibold text-gray-700">Ward Features</label>
                <div className="flex flex-wrap gap-3">
                  {availableFeatures.map((feature) => (
                    <label key={feature} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={features.includes(feature)}
                        onChange={() => toggleFeature(feature)}
                        className="accent-teal-600"
                      />
                      <span className="text-gray-700">{feature}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="w-full md:mt-7.5 flex flex-col gap-2 col-span-2">
                <button
                  type="button"
                  onClick={addRoom}
                  className="w-full p-2 bg-teal-500 rounded-md text-white cursor-pointer hover:bg-teal-600 transition-colors duration-200"
                >
                  Add Room
                </button>
              </div>
            </div>

            <div className="grid grid-cols-3 mt-6 grid-flow-col text-start py-3 px-6 border-b border-gray-300 font-medium text-gray-500">
              <p>Room No</p>
              <p>No. of Beds</p>
              <p>Action</p>
            </div>

            {rooms.map((room, index) => (
              <div
                key={index}
                className="flex flex-wrap justify-start sm:grid grid-cols-3 items-center text-start text-gray-600 py-3 px-6 border-b border-gray-200"
              >
                <p>{room.wardNo}</p>
                <input
                  className="p-2 border outline-none border-teal-400 rounded-md w-20 focus:ring-2 focus:ring-teal-500"
                  type="number"
                  min="1"
                  value={room.beds}
                  onChange={(e) => updateRoom(index, 'beds', e.target.value)}
                />
                <button
                  type="button"
                  className="text-start cursor-pointer hover:text-red-600 transition-colors duration-200"
                  onClick={() => removeRoom(index)}
                  aria-label={`Remove room ${room.wardNo}`}
                >
                  <img className="w-7" src={assets.delete_icon} alt="Delete icon" />
                </button>
              </div>
            ))}

            <button
              type="submit"
              className="w-full p-2 my-6 bg-teal-500 rounded-md text-white cursor-pointer hover:bg-teal-600 transition-colors duration-200"
            >
              {editWard ? 'Update Ward' : 'Save Ward'}
            </button>
          </div>
        </form>
      ) : (
        <div className="bg-white border border-gray-300 px-8 py-8 rounded w-full max-w-4xl mx-auto overflow-x-auto">
          <table className="w-full font-medium text-left text-gray-600 border-collapse">
            <thead>
              <tr className="border-b">
                <th className="p-3">Ward Name</th>
                <th className="p-3">Category</th>
                <th className="p-3">Features</th>
                <th className="p-3">Rooms</th>
                <th className="p-3">Total Beds</th>
                <th className="p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {wardList.length > 0 ? (
                wardList.map((ward, index) => (
                  <tr key={index} className="border-b hover:bg-gray-50">
                    <td className="p-3">{ward.wardName}</td>
                    <td className="p-3">{ward.wardCategory || 'N/A'}</td>
                    <td className="p-3">{ward.features?.join(', ') || 'None'}</td>
                    <td className="p-3">{ward.wardNumbers.length}</td>
                    <td className="p-3">
                      {ward.wardNumbers.reduce((sum, r) => sum + r.beds, 0)}
                    </td>
                    <td className="p-3">
                      <button
                        onClick={() => startEditing(ward)}
                        className="text-teal-600 hover:text-teal-800"
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="p-3 text-center text-gray-400">
                    No wards available.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AddWard;
