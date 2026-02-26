import React from 'react';
import { motion } from 'framer-motion';

const PageTransition = ({ children }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}  // Start: Invisible and slightly down
      animate={{ opacity: 1, y: 0 }}   // End: Visible and in place
      exit={{ opacity: 0, y: -20 }}    // Exit: Fade out and move up
      transition={{ duration: 0.4, ease: "easeInOut" }} // Speed: Smooth
    >
      {children}
    </motion.div>
  );
};

export default PageTransition;