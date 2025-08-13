import cron from 'node-cron';
import BedAllocationModel from '../Models/BedAllocationModel.js';

const expireOldBeds = async () => {
  const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
  const result = await BedAllocationModel.deleteMany({ allocationTime: { $lt: twoHoursAgo }, isAdmitted: false });
  console.log(`[BED CLEANUP] Freed ${result.deletedCount} expired bed(s)`);
};

export const startBedReleaseScheduler = () => {
  cron.schedule('*/10 * * * *', async () => {
    await expireOldBeds();
  });
  console.log('Bed release scheduler started (every 10 minutes)');
};
