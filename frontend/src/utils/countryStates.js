// Country and their states/regions for Taskeeu signup
// Sorted alphabetically within each country

export const COUNTRIES = [
  { code: 'NG', name: 'Nigeria', flag: 'NG', currency: 'NGN' },
  { code: 'GH', name: 'Ghana', flag: 'GH', currency: 'GHS' },
  { code: 'KE', name: 'Kenya', flag: 'KE', currency: 'KES' },
  { code: 'ZA', name: 'South Africa', flag: 'ZA', currency: 'ZAR' },
  { code: 'TZ', name: 'Tanzania', flag: 'TZ', currency: 'TZS' },
  { code: 'UG', name: 'Uganda', flag: 'UG', currency: 'UGX' },
  { code: 'RW', name: 'Rwanda', flag: 'RW', currency: 'RWF' },
  { code: 'ZM', name: 'Zambia', flag: 'ZM', currency: 'ZMW' },
  { code: 'GB', name: 'United Kingdom', flag: 'GB', currency: 'GBP' },
  { code: 'US', name: 'United States', flag: 'US', currency: 'USD' },
];

export const STATES_BY_COUNTRY = {
  NG: [
    'Abia','Adamawa','Akwa Ibom','Anambra','Bauchi','Bayelsa','Benue','Borno',
    'Cross River','Delta','Ebonyi','Edo','Ekiti','Enugu','FCT Abuja','Gombe',
    'Imo','Jigawa','Kaduna','Kano','Katsina','Kebbi','Kogi','Kwara','Lagos',
    'Nasarawa','Niger','Ogun','Ondo','Osun','Oyo','Plateau','Rivers','Sokoto',
    'Taraba','Yobe','Zamfara',
  ],
  GH: [
    'Ahafo','Ashanti','Bono','Bono East','Central','Eastern','Greater Accra',
    'North East','Northern','Oti','Savannah','Upper East','Upper West','Volta',
    'Western','Western North',
  ],
  KE: [
    'Baringo','Bomet','Bungoma','Busia','Elgeyo-Marakwet','Embu','Garissa',
    'Homa Bay','Isiolo','Kajiado','Kakamega','Kericho','Kiambu','Kilifi',
    'Kirinyaga','Kisii','Kisumu','Kitui','Kwale','Laikipia','Lamu','Machakos',
    'Makueni','Mandera','Marsabit','Meru','Migori','Mombasa','Murang\'a',
    'Nairobi','Nakuru','Nandi','Narok','Nyamira','Nyandarua','Nyeri','Samburu',
    'Siaya','Taita-Taveta','Tana River','Tharaka-Nithi','Trans-Nzoia','Turkana',
    'Uasin Gishu','Vihiga','Wajir','West Pokot',
  ],
  ZA: [
    'Eastern Cape','Free State','Gauteng','KwaZulu-Natal','Limpopo','Mpumalanga',
    'North West','Northern Cape','Western Cape',
  ],
  TZ: [
    'Arusha','Dar es Salaam','Dodoma','Geita','Iringa','Kagera','Katavi',
    'Kigoma','Kilimanjaro','Lindi','Manyara','Mara','Mbeya','Morogoro','Mtwara',
    'Mwanza','Njombe','Pemba North','Pemba South','Pwani','Rukwa','Ruvuma',
    'Shinyanga','Simiyu','Singida','Songwe','Tabora','Tanga','Zanzibar North',
    'Zanzibar South','Zanzibar West',
  ],
  UG: [
    'Abim','Adjumani','Agago','Alebtong','Amolatar','Amudat','Amuria','Amuru',
    'Apac','Arua','Budaka','Bududa','Bugiri','Buhweju','Buikwe','Bukedea',
    'Bukomansimbi','Bukwo','Bulambuli','Bundibugyo','Bushenyi','Busia','Buyende',
    'Central Region','Eastern Region','Northern Region','Western Region',
  ],
  RW: [
    'Kigali City','Eastern Province','Northern Province','Southern Province','Western Province',
  ],
  ZM: [
    'Central','Copperbelt','Eastern','Luapula','Lusaka','Muchinga','North-Western',
    'Northern','Southern','Western',
  ],
  GB: [
    'England','Northern Ireland','Scotland','Wales',
    'Greater London','South East England','South West England','East of England',
    'East Midlands','West Midlands','Yorkshire and the Humber',
    'North West England','North East England',
  ],
  US: [
    'Alabama','Alaska','Arizona','Arkansas','California','Colorado','Connecticut',
    'Delaware','Florida','Georgia','Hawaii','Idaho','Illinois','Indiana','Iowa',
    'Kansas','Kentucky','Louisiana','Maine','Maryland','Massachusetts','Michigan',
    'Minnesota','Mississippi','Missouri','Montana','Nebraska','Nevada',
    'New Hampshire','New Jersey','New Mexico','New York','North Carolina',
    'North Dakota','Ohio','Oklahoma','Oregon','Pennsylvania','Rhode Island',
    'South Carolina','South Dakota','Tennessee','Texas','Utah','Vermont',
    'Virginia','Washington','West Virginia','Wisconsin','Wyoming',
  ],
};

export const getStates = (countryCode) => STATES_BY_COUNTRY[countryCode] || [];

export const getCurrencyForCountry = (countryCode) => {
  const c = COUNTRIES.find(c => c.code === countryCode);
  return c?.currency || 'NGN';
};

export const getFlutterwaveBankCountry = (countryCode) => {
  // Flutterwave bank country codes
  const map = { NG: 'NG', GH: 'GH', KE: 'KE', ZA: 'ZA', TZ: 'TZ', UG: 'UG', RW: 'RW', ZM: 'ZM', GB: 'UK', US: 'US' };
  return map[countryCode] || 'NG';
};
