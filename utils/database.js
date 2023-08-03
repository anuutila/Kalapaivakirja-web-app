if ( process.env.NODE_ENV !== 'production' ) {
    require('dotenv').config()
  }
  
  const getMONGODB_URI = () => {
    return process.env.MONGODB_URI;
  };
  
  module.exports = getMONGODB_URI;