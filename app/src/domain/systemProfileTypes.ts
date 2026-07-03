export type DataPlateSide = 'indoor' | 'outdoor';

export type DataPlatePhoto = {
  id?: string;
  side: DataPlateSide;
  label: string;
  localUri?: string;
  publicUrl?: string;
  storagePath?: string;
  capturedAt?: string;
};

export type AirHandlerLocation =
  | 'attic'
  | 'garage'
  | 'closet'
  | 'mechanical_room'
  | 'crawlspace'
  | 'basement'
  | 'roof'
  | 'hallway'
  | 'other'
  | 'unknown';

export const AIR_HANDLER_LOCATION_OPTIONS: { label: string; value: AirHandlerLocation; pricingNote: string }[] = [
  { label: 'Attic', value: 'attic', pricingNote: 'Usually higher labor because of heat, access, decking, lighting, drain routing, and safety setup.' },
  { label: 'Garage', value: 'garage', pricingNote: 'Often easier access and lower labor risk than attic or crawlspace installs.' },
  { label: 'Closet', value: 'closet', pricingNote: 'Access depends on door size, platform, drain, and how tight the cabinet fit is.' },
  { label: 'Mechanical room', value: 'mechanical_room', pricingNote: 'Usually good access, but existing piping, ductwork, and clearance still matter.' },
  { label: 'Crawlspace', value: 'crawlspace', pricingNote: 'Often higher labor due to confined access, moisture, lighting, and safety setup.' },
  { label: 'Basement', value: 'basement', pricingNote: 'Access varies, but usually easier than attic/crawlspace if clearances are good.' },
  { label: 'Roof', value: 'roof', pricingNote: 'May require roof access, curb/stand review, crane/lift planning, and weather considerations.' },
  { label: 'Hallway', value: 'hallway', pricingNote: 'Common for condos/apartments; access and drain routing are key.' },
  { label: 'Other', value: 'other', pricingNote: 'Contractor should confirm access, clearance, drain, electrical, and duct conditions.' },
  { label: 'I am not sure', value: 'unknown', pricingNote: 'A photo or short description will help the contractor give a better estimate.' }
];

export type HvacSystemProfile = {
  id?: string;
  homeId?: string;
  systemType: string;
  brand?: string;
  indoorModelNumber?: string;
  indoorSerialNumber?: string;
  outdoorModelNumber?: string;
  outdoorSerialNumber?: string;
  estimatedAgeYears?: number;
  tonnage?: number;
  refrigerantType?: string;
  filterSize?: string;
  airHandlerLocation?: AirHandlerLocation;
  airHandlerLocationNotes?: string;
  accessNotes?: string;
  installDate?: string;
  warrantyNotes?: string;
  notes?: string;
  dataPlatePhotos: DataPlatePhoto[];
};

export const DATA_PLATE_GUIDANCE = {
  indoor: {
    title: 'Indoor unit data plate',
    examples: ['air handler', 'furnace', 'fan coil', 'evaporator cabinet'],
    captureTips: [
      'Look inside the closet, attic, garage, or mechanical room.',
      'Find the sticker or metal plate with model and serial numbers.',
      'Use good light and keep the phone square to the label.',
      'Avoid touching wiring, panels, or sharp metal edges.'
    ]
  },
  outdoor: {
    title: 'Outdoor unit data plate',
    examples: ['condenser', 'heat pump', 'package unit nameplate'],
    captureTips: [
      'Look on the side or back of the outdoor unit cabinet.',
      'Capture the full label, not just the barcode.',
      'Step back enough that the model and serial numbers are readable.',
      'Do not remove service panels or reach into the unit.'
    ]
  }
};
