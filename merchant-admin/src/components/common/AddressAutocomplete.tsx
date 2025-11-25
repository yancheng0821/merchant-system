import React, { useEffect, useRef, useState } from 'react';
import { TextField, InputAdornment, CircularProgress } from '@mui/material';
import { LocationOn as LocationIcon } from '@mui/icons-material';

/**
 * IMPORTANT: Google Maps API Key Configuration
 *
 * To use this component, you need a Google Maps API key with the Places API enabled.
 *
 * Steps to enable Places API:
 * 1. Go to Google Cloud Console (https://console.cloud.google.com/)
 * 2. Select your project (or create a new one)
 * 3. Navigate to "APIs & Services" > "Library"
 * 4. Search for "Places API" and click on it
 * 5. Click "Enable" button
 * 6. Also enable "Geocoding API" if you need geocoding features
 * 7. Go to "APIs & Services" > "Credentials" to get your API key
 * 8. Add the API key to your .env file as REACT_APP_GOOGLE_MAPS_API_KEY
 *
 * Note: Google recommends using the newer PlaceAutocompleteElement API.
 * The current Autocomplete API will continue to receive bug fixes but
 * new features will only be added to PlaceAutocompleteElement.
 */
const GOOGLE_MAPS_API_KEY = process.env.REACT_APP_GOOGLE_MAPS_API_KEY || '';

export interface ParsedAddress {
  fullAddress: string;
  streetAddress: string;
  city: string;
  province: string;
  country: string;
  postalCode: string;
}

interface AddressAutocompleteProps {
  onAddressSelect: (address: ParsedAddress) => void;
  defaultCountry?: string; // ISO country code, e.g., 'ca', 'us'
  label?: string;
  helperText?: string;
  placeholder?: string;
  value?: string;
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  fullWidth?: boolean;
  error?: boolean;
  disabled?: boolean;
  required?: boolean;
  sx?: any; // Allow custom sx styles to be passed
}

// Extend the Window interface to include google
declare global {
  interface Window {
    google: any;
  }
}

const AddressAutocomplete: React.FC<AddressAutocompleteProps> = ({
  onAddressSelect,
  defaultCountry,
  label,
  helperText,
  placeholder,
  value = '', // Default to empty string to ensure controlled component
  onChange,
  fullWidth = false,
  error = false,
  disabled = false,
  required = false,
  sx,
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const autocompleteRef = useRef<any>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load Google Maps Script
  useEffect(() => {
    if (window.google?.maps?.places) {
      setIsLoaded(true);
      return;
    }

    // Check if script already exists
    const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
    if (existingScript) {
      existingScript.addEventListener('load', () => setIsLoaded(true));
      return;
    }

    const script = document.createElement('script');
    // Use weekly version for latest features
    // Note: We use script async/defer attributes instead of loading=async parameter
    // because loading=async changes initialization behavior
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places&v=weekly&callback=initGoogleMaps`;
    script.async = true;
    script.defer = true;

    // Define callback function
    (window as any).initGoogleMaps = () => {
      setIsLoaded(true);
    };

    script.onerror = () => {
      setLoadError(true);
    };

    document.head.appendChild(script);
  }, []);

  // Initialize Autocomplete
  useEffect(() => {
    if (!isLoaded || !inputRef.current || autocompleteRef.current || disabled) {
      return;
    }

    try {
      const autocomplete = new window.google.maps.places.Autocomplete(inputRef.current, {
        types: ['address'],
        fields: ['address_components', 'formatted_address', 'name'],
        componentRestrictions: defaultCountry ? { country: defaultCountry.toLowerCase() } : undefined,
      });

      autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace();

        if (place.address_components) {
          const parsed: ParsedAddress = {
            fullAddress: place.formatted_address || '',
            streetAddress: '',
            city: '',
            province: '',
            country: '',
            postalCode: '',
          };

          // Parse address components
          place.address_components.forEach((component: any) => {
            const types = component.types;

            if (types.includes('street_number')) {
              parsed.streetAddress = component.long_name;
            }

            if (types.includes('route')) {
              parsed.streetAddress += (parsed.streetAddress ? ' ' : '') + component.long_name;
            }

            if (types.includes('locality')) {
              parsed.city = component.long_name;
            } else if (types.includes('sublocality_level_1') && !parsed.city) {
              parsed.city = component.long_name;
            } else if (types.includes('administrative_area_level_2') && !parsed.city) {
              parsed.city = component.long_name;
            }

            if (types.includes('administrative_area_level_1')) {
              parsed.province = component.long_name;
            }

            if (types.includes('country')) {
              parsed.country = component.long_name;
            }

            if (types.includes('postal_code')) {
              parsed.postalCode = component.long_name;
            }
          });

          if (!parsed.streetAddress && place.name) {
            parsed.streetAddress = place.name;
          }

          // Trigger the parent's address select callback
          // This will update all fields including address, city, province, country, postCode
          onAddressSelect(parsed);

          // Close the dropdown
          // Use requestAnimationFrame to ensure this happens after Google's internal updates
          requestAnimationFrame(() => {
            if (inputRef.current) {
              inputRef.current.blur();
            }

            // Hide the Google autocomplete dropdown
            const pacContainers = document.querySelectorAll('.pac-container');
            pacContainers.forEach(container => {
              (container as HTMLElement).style.display = 'none';
            });

            // Force hide again after a short delay to handle any re-renders
            setTimeout(() => {
              const pacContainers = document.querySelectorAll('.pac-container');
              pacContainers.forEach(container => {
                (container as HTMLElement).style.display = 'none';
              });
            }, 100);
          });
        }
      });

      autocompleteRef.current = autocomplete;
    } catch (error) {
      console.error('Error initializing Google Places Autocomplete:', error);
      setLoadError(true);
    }

    return () => {
      if (autocompleteRef.current) {
        window.google.maps.event.clearInstanceListeners(autocompleteRef.current);
        autocompleteRef.current = null;
      }
    };
  }, [isLoaded, defaultCountry, onAddressSelect, disabled]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (onChange) {
      onChange(e);
    }
  };

  if (loadError) {
    return (
      <TextField
        fullWidth={fullWidth}
        label={label}
        value={value}
        onChange={handleInputChange}
        error={true}
        helperText="Error loading Google Maps"
        disabled
        required={required}
        sx={sx}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <LocationIcon />
            </InputAdornment>
          ),
        }}
      />
    );
  }

  if (!isLoaded) {
    return (
      <TextField
        fullWidth={fullWidth}
        label={label}
        value={value}
        onChange={handleInputChange}
        helperText="Loading Google Maps..."
        disabled
        required={required}
        sx={sx}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <LocationIcon />
            </InputAdornment>
          ),
          endAdornment: (
            <InputAdornment position="end">
              <CircularProgress size={20} />
            </InputAdornment>
          ),
        }}
      />
    );
  }

  return (
    <TextField
      fullWidth={fullWidth}
      label={label}
      value={value}
      onChange={handleInputChange}
      placeholder={placeholder}
      error={error}
      helperText={helperText}
      disabled={disabled}
      required={required}
      inputRef={inputRef}
      sx={sx}
      InputProps={{
        startAdornment: (
          <InputAdornment position="start">
            <LocationIcon sx={{ color: '#667eea' }} />
          </InputAdornment>
        ),
      }}
    />
  );
};

export default AddressAutocomplete;
