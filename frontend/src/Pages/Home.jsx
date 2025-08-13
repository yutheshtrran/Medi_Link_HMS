// Home.jsx
import React, { useState, useEffect } from 'react';
import Header from '../Components/Header';
import SpecializeMenu from '../Components/SpecializeMenu';
import TopDoctors from '../Components/TopDoctors';
import Banner from '../Components/Banner';
import Chatbot from '../Components/ChatBot';
import Day from '../Components/Day';
import Loader from '../Components/Loader';
import ChartNavigator from '../Components/ChartNavigator';


const Home = () => {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Show loader just once when Home mounts (after login)
    const timer = setTimeout(() => {
      setLoading(false);
    }, 2000); // 2 seconds loader

    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      {loading && <Loader />} {/* Shows blur loader over Home content */}
      <div style={{ filter: loading ? 'blur(8px)' : 'none', transition: 'filter 0.3s ease' }}>
        <Header />
        <SpecializeMenu />
        <TopDoctors />
        <Banner />
        <Chatbot />
        <ChartNavigator/>
        <Day />
      </div>
    </>
  );
};

export default Home;
