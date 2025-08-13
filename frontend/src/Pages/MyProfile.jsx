import React, { useContext, useEffect, useState } from 'react';
import { assets } from '../assets/assets';
import { AppContext } from '../Context/AppContext';

const MyProfile = () => {
  const [edit, setEdit] = useState(false);
  const [editUserData, setEditUserData] = useState(null);
  const [image , setImage] = useState(null);
  const { userData, token, backendUrl, loadUserProfileData, updateUserProfile } = useContext(AppContext);

  const handleUpdateProfile = async () => {
    await updateUserProfile(editUserData, image);
    await loadUserProfileData();
    setEdit(false);
  };

  useEffect(() => {
    if (edit && userData) {
      setEditUserData({ ...userData });
    }
  }, [edit, userData]);

  if (!userData) return <div className="text-center py-20 text-gray-600">Loading profile...</div>;

  const currentDate = new Date();
  const formattedDate = currentDate.toLocaleDateString('en-GB', {
    weekday: 'short',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  return (
    <section className="w-full min-h-screen bg-gradient-to-r from-teal-200 text-teal-900">
      <div className="w-full flex flex-col gap-2">
        <div className="w-full flex flex-col gap-2 items-start my-4 px-5">
          <h2 className="text-xl font-semibold">{`Welcome, ${userData.name}`}</h2>
          <p className="text-sm text-teal-600">{formattedDate}</p>
        </div>

        <div className="bg-white rounded-lg shadow-lg mx-5 mt-8 overflow-hidden">
          <div className="flex justify-between items-center p-5 border-b border-teal-200">
            <div className="flex items-center gap-4">
              {
                edit ? (
                  <input
                    type="file"
                    className="w-24"
                    onChange={(e) => setImage(e.target.files[0])}
                  />
                ) : (
                  <img
                    className='w-24 h-24 rounded-full object-cover border-4 border-teal-400'
                    src={userData.image || assets.user}
                    alt="Profile"
                  />
                )
              }

              <div>
                <p className="text-lg font-semibold text-teal-900">{userData.name}</p>
                <p className="text-sm text-teal-500">{userData.email}</p>
              </div>
            </div>

            <button
              onClick={edit ? handleUpdateProfile : () => setEdit(true)}
              className={`px-10 py-2.5 rounded-sm text-white cursor-pointer transition ${
                edit ? 'bg-teal-600 hover:bg-teal-700' : 'bg-teal-600 hover:bg-teal-900'
              }`}
            >
              {edit ? 'Save' : 'Edit'}
            </button>
          </div>

          <div className="p-5">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">

              <div className="col-span-2 flex flex-col gap-2">
                <label className="block text-teal-700 font-medium">User name:</label>
                {
                  edit ? (
                    <input
                      value={editUserData?.name || ''}
                      onChange={(e) => setEditUserData(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full p-2 border border-teal-400 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-400"
                      type="text"
                    />
                  ) : <p className="text-teal-900">{userData.name}</p>
                }
              </div>

              <div className="col-span-2 flex flex-col gap-2">
                <label className="block text-teal-700 font-medium">Email:</label>
                {
                  edit ? (
                    <input
                      value={editUserData?.email || ''}
                      onChange={(e) => setEditUserData(prev => ({ ...prev, email: e.target.value }))}
                      className="w-full p-2 border border-teal-400 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-400"
                      type="email"
                    />
                  ) : <p className="text-teal-900">{userData.email}</p>
                }
              </div>

              <div className="col-span-2 flex flex-col gap-2">
                <label className="block text-teal-700 font-medium">Phone:</label>
                {
                  edit ? (
                    <input
                      value={editUserData?.phone_number || ''}
                      onChange={(e) => setEditUserData(prev => ({ ...prev, phone_number: e.target.value }))}
                      className="w-full p-2 border border-teal-400 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-400"
                      type="text"
                    />
                  ) : <p className="text-teal-900">{userData.phone_number}</p>
                }
              </div>

              <div className="col-span-2 flex flex-col gap-2">
                <label className="block text-teal-700 font-medium">Gender:</label>
                {
                  edit ? (
                    <select
                      value={editUserData?.gender || 'Male'}
                      onChange={(e) => setEditUserData(prev => ({ ...prev, gender: e.target.value }))}
                      className="w-full p-2 border border-teal-400 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-400"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                    </select>
                  ) : <p className="text-teal-900">{userData.gender}</p>
                }
              </div>

              <div className="col-span-2 flex flex-col gap-2">
                <label className="block text-teal-700 font-medium">Date Of Birth:</label>
                {
                  edit ? (
                    <input
                      value={editUserData?.dob || ''}
                      onChange={(e) => setEditUserData(prev => ({ ...prev, dob: e.target.value }))}
                      className="w-full p-2 border border-teal-400 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-400"
                      type="date"
                    />
                  ) : <p className="text-teal-900">{userData.dob}</p>
                }
              </div>

              <div className="col-span-2 flex flex-col gap-2">
                <label className="block text-teal-700 font-medium">Address:</label>
                <div className="flex flex-col md:flex-row gap-3">
                  {
                    edit ? (
                      <>
                        <input
                          value={editUserData?.address?.line1 || ''}
                          onChange={(e) => setEditUserData(prev => ({
                            ...prev,
                            address: {
                              ...(prev.address || {}),
                              line1: e.target.value
                            }
                          }))}
                          className="w-full p-2 border border-teal-400 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-400"
                          type="text"
                        />
                        <input
                          value={editUserData?.address?.line2 || ''}
                          onChange={(e) => setEditUserData(prev => ({
                            ...prev,
                            address: {
                              ...(prev.address || {}),
                              line2: e.target.value
                            }
                          }))}
                          className="w-full p-2 border border-teal-400 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-400"
                          type="text"
                        />
                      </>
                    ) : (
                      <>
                        <p className="text-teal-900">{userData.address?.line1 || ''},</p>
                        <p className="text-teal-900">{userData.address?.line2 || ''}</p>
                      </>
                    )
                  }
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default MyProfile;
