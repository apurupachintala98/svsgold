// India State, District, City and Pincode mapping
// Using a simplified dataset for common Indian locations

export const stateDistrictCityMap = {
  'Andhra Pradesh': {
    'Visakhapatnam': { cities: ['Visakhapatnam', 'Gajuwaka', 'Atchutapuram'], pincodes: ['530001', '530003', '530024'] },
    'Krishna': { cities: ['Vijayawada', 'Krishnapatnam', 'Nuzvid'], pincodes: ['520001', '524346', '517595'] },
    'Chittoor': { cities: ['Chittoor', 'Tirupati', 'Punganur'], pincodes: ['517001', '517501', '517353'] },
  },
  'Bihar': {
    'Patna': { cities: ['Patna', 'Danapur', 'Naubatpur'], pincodes: ['800001', '801105', '803101'] },
    'Gaya': { cities: ['Gaya', 'Wauzabad', 'Tikari'], pincodes: ['823001', '824211', '824211'] },
  },
  'Gujarat': {
    'Ahmedabad': { cities: ['Ahmedabad', 'Isanpur', 'Bavla'], pincodes: ['380001', '382443', '382220'] },
    'Surat': { cities: ['Surat', 'Katargam', 'Varaccha'], pincodes: ['395001', '395004', '395006'] },
    'Vadodara': { cities: ['Vadodara', 'Fatehpura', 'Karjan'], pincodes: ['390001', '390020', '391240'] },
  },
  'Haryana': {
    'Faridabad': { cities: ['Faridabad', 'Ballabgarh', 'Mathura Road'], pincodes: ['121001', '121003', '121002'] },
    'Gurgaon': { cities: ['Gurgaon', 'New Gurgaon', 'Sohna'], pincodes: ['122001', '122018', '122103'] },
  },
  'Himachal Pradesh': {
    'Shimla': { cities: ['Shimla', 'Kufri', 'Chail'], pincodes: ['171001', '171201', '171101'] },
    'Kangra': { cities: ['Kangra', 'Palampur', 'Baijnath'], pincodes: ['176001', '176061', '176125'] },
  },
  'Jharkhand': {
    'Ranchi': { cities: ['Ranchi', 'Namkum', 'Kanke'], pincodes: ['834001', '835324', '835217'] },
    'Dhanbad': { cities: ['Dhanbad', 'Sindri', 'Baliapur'], pincodes: ['826001', '828111', '825302'] },
  },
  'Karnataka': {
    'Bengaluru': { cities: ['Bengaluru', 'Whitefield', 'Koramangala'], pincodes: ['560001', '560066', '560095'] },
    'Mysore': { cities: ['Mysore', 'Nanjangud', 'Pandavapura'], pincodes: ['570001', '571002', '571201'] },
    'Belgaum': { cities: ['Belgaum', 'Londa', 'Soundatti'], pincodes: ['590001', '591303', '591128'] },
  },
  'Kerala': {
    'Ernakulam': { cities: ['Kochi', 'Thrippunithura', 'Kalamassery'], pincodes: ['682001', '682301', '682025'] },
    'Thiruvananthapuram': { cities: ['Thiruvananthapuram', 'Veli', 'Kilimanoor'], pincodes: ['695001', '695521', '695603'] },
  },
  'Madhya Pradesh': {
    'Indore': { cities: ['Indore', 'Mhow', 'Ujjain'], pincodes: ['452001', '453441', '456010'] },
    'Bhopal': { cities: ['Bhopal', 'Sehore', 'Imarati'], pincodes: ['462001', '466001', '462021'] },
  },
  'Maharashtra': {
    'Mumbai': { cities: ['Mumbai', 'Thane', 'Navi Mumbai'], pincodes: ['400001', '400601', '400708'] },
    'Pune': { cities: ['Pune', 'Pimpri-Chinchwad', 'Lonavala'], pincodes: ['411001', '411019', '410401'] },
    'Nashik': { cities: ['Nashik', 'Sinnar', 'Yavat'], pincodes: ['422001', '422110', '423503'] },
  },
  'Manipur': {
    'Imphal': { cities: ['Imphal', 'Imphal West', 'Lilong'], pincodes: ['795001', '795145', '795149'] },
  },
  'Meghalaya': {
    'Shillong': { cities: ['Shillong', 'Nongthymmai', 'Nongpoh'], pincodes: ['793001', '793011', '794110'] },
  },
  'Mizoram': {
    'Aizawl': { cities: ['Aizawl', 'Lunglei', 'Saiha'], pincodes: ['796001', '796701', '796902'] },
  },
  'Nagaland': {
    'Kohima': { cities: ['Kohima', 'Dimapur', 'Kiphire'], pincodes: ['797001', '797112', '798627'] },
  },
  'Odisha': {
    'Bhubaneswar': { cities: ['Bhubaneswar', 'Cuttack', 'Rourkela'], pincodes: ['751001', '753001', '769001'] },
  },
  'Punjab': {
    'Amritsar': { cities: ['Amritsar', 'Batala', 'Jandiala'], pincodes: ['143001', '143505', '143517'] },
    'Ludhiana': { cities: ['Ludhiana', 'Samrala', 'Morinda'], pincodes: ['141001', '141115', '140407'] },
  },
  'Rajasthan': {
    'Jaipur': { cities: ['Jaipur', 'Ajmer', 'Kishangarh'], pincodes: ['302001', '305001', '305409'] },
    'Jodhpur': { cities: ['Jodhpur', 'Bilara', 'Osian'], pincodes: ['342001', '342605', '342401'] },
  },
  'Sikkim': {
    'Gangtok': { cities: ['Gangtok', 'Ranipool', 'Namchi'], pincodes: ['737001', '737135', '737126'] },
  },
  'Tamil Nadu': {
    'Chennai': { cities: ['Chennai', 'Kanchipuram', 'Chengalpattu'], pincodes: ['600001', '631501', '603001'] },
    'Coimbatore': { cities: ['Coimbatore', 'Tiruppur', 'Nilgiri'], pincodes: ['641001', '641602', '643001'] },
  },
  'Telangana': {
    'Hyderabad': { cities: ['Hyderabad', 'Secunderabad', 'Telangana'], pincodes: ['500001', '500003', '500080'] },
    'Warangal': { cities: ['Warangal', 'Karimnagar', 'Khammam'], pincodes: ['506001', '505001', '507001'] },
  },
  'Tripura': {
    'Agartala': { cities: ['Agartala', 'Ambassa', 'Dharmanagar'], pincodes: ['799001', '799201', '799250'] },
  },
  'Uttar Pradesh': {
    'Lucknow': { cities: ['Lucknow', 'Kanpur', 'Ghazipur'], pincodes: ['226001', '208001', '233001'] },
    'Delhi': { cities: ['Delhi', 'New Delhi', 'North Delhi'], pincodes: ['110001', '110011', '110007'] },
    'Agra': { cities: ['Agra', 'Firozabad', 'Mainpuri'], pincodes: ['282001', '283203', '205001'] },
  },
  'Uttarakhand': {
    'Dehradun': { cities: ['Dehradun', 'Mussoorie', 'Rishikesh'], pincodes: ['248001', '248179', '249201'] },
    'Almora': { cities: ['Almora', 'Nainital', 'Bageshwar'], pincodes: ['263601', '263002', '263605'] },
  },
  'West Bengal': {
    'Kolkata': { cities: ['Kolkata', 'Howrah', 'Hooghly'], pincodes: ['700001', '711101', '712232'] },
    'Darjeeling': { cities: ['Darjeeling', 'Kurseong', 'Kalimpong'], pincodes: ['734101', '734203', '734301'] },
  },
};

export const getAllStates = () => {
  return Object.keys(stateDistrictCityMap).sort();
};

export const getDistrictsByState = (state) => {
  return state && stateDistrictCityMap[state] 
    ? Object.keys(stateDistrictCityMap[state]).sort()
    : [];
};

export const getCitiesByStateAndDistrict = (state, district) => {
  if (!state || !district) return [];
  const districtData = stateDistrictCityMap[state]?.[district];
  return districtData?.cities || [];
};

export const getPincodesByCityStateDistrict = (state, district, city) => {
  if (!state || !district || !city) return [];
  const districtData = stateDistrictCityMap[state]?.[district];
  if (districtData?.cities?.includes(city)) {
    return districtData.pincodes;
  }
  return [];
};

export const getStateByPincode = (pincode) => {
  for (const [state, districts] of Object.entries(stateDistrictCityMap)) {
    for (const [district, data] of Object.entries(districts)) {
      if (data.pincodes?.includes(pincode)) {
        return { state, district, city: data.cities?.[0] || '' };
      }
    }
  }
  return null;
};
