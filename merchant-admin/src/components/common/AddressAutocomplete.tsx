import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  TextField,
  InputAdornment,
  CircularProgress,
  Paper,
  Popper,
  ClickAwayListener,
  Box,
  Typography,
} from '@mui/material';
import { LocationOn as LocationIcon } from '@mui/icons-material';
import { API_BASE_URL } from '../../config/environment';

export interface ParsedAddress {
  fullAddress: string;
  streetAddress: string;
  city: string;
  province: string;
  country: string;
  postalCode: string;
}

interface AutocompletePrediction {
  placeId: string;
  description: string;
  mainText: string;
  secondaryText: string;
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
  sx?: any;
}

const AddressAutocomplete: React.FC<AddressAutocompleteProps> = ({
  onAddressSelect,
  defaultCountry,
  label,
  helperText,
  placeholder,
  value = '',
  onChange,
  fullWidth = false,
  error = false,
  disabled = false,
  required = false,
  sx,
}) => {
  const [predictions, setPredictions] = useState<AutocompletePrediction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [inputValue, setInputValue] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Sync inputValue with external value
  useEffect(() => {
    setInputValue(value);
  }, [value]);

  // Debounced autocomplete API call
  const fetchAutocomplete = useCallback(async (input: string) => {
    if (!input || input.length < 3) {
      setPredictions([]);
      setShowDropdown(false);
      return;
    }

    setIsLoading(true);
    try {
      const params = new URLSearchParams({ input });
      if (defaultCountry) {
        params.append('country', defaultCountry.toLowerCase());
      }

      const response = await fetch(`${API_BASE_URL}/api/public/places/autocomplete?${params}`);
      const data = await response.json();

      if (data.success && data.predictions) {
        setPredictions(data.predictions);
        setShowDropdown(data.predictions.length > 0);
      } else {
        setPredictions([]);
        setShowDropdown(false);
      }
    } catch (err) {
      console.error('Autocomplete error:', err);
      setPredictions([]);
      setShowDropdown(false);
    } finally {
      setIsLoading(false);
    }
  }, [defaultCountry]);

  // Handle input change with debounce
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);

    // Call parent onChange if provided
    if (onChange) {
      onChange(e);
    }

    // Debounce API calls
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      fetchAutocomplete(newValue);
    }, 300);
  };

  // Handle prediction selection
  const handleSelectPrediction = async (prediction: AutocompletePrediction) => {
    setShowDropdown(false);
    setIsLoading(true);

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/public/places/details?placeId=${encodeURIComponent(prediction.placeId)}`
      );
      const data = await response.json();

      if (data.success && data.result) {
        const details = data.result;
        const parsed: ParsedAddress = {
          fullAddress: details.formattedAddress || prediction.description,
          streetAddress: details.streetAddress || '',
          city: details.city || '',
          province: details.province || '',
          country: details.country || '',
          postalCode: details.postalCode || '',
        };

        // Update input to show street address
        setInputValue(parsed.streetAddress);

        // Notify parent
        onAddressSelect(parsed);
      } else {
        // Fallback: use prediction description
        setInputValue(prediction.mainText);
        onAddressSelect({
          fullAddress: prediction.description,
          streetAddress: prediction.mainText,
          city: '',
          province: '',
          country: '',
          postalCode: '',
        });
      }
    } catch (err) {
      console.error('Place details error:', err);
      // Fallback
      setInputValue(prediction.mainText);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle click away
  const handleClickAway = () => {
    setShowDropdown(false);
  };

  // Handle focus
  const handleFocus = () => {
    if (predictions.length > 0) {
      setShowDropdown(true);
    }
  };

  return (
    <ClickAwayListener onClickAway={handleClickAway}>
      <Box sx={{ position: 'relative', width: fullWidth ? '100%' : 'auto' }}>
        <TextField
          fullWidth={fullWidth}
          label={label}
          value={inputValue}
          onChange={handleInputChange}
          onFocus={handleFocus}
          placeholder={placeholder}
          error={error}
          helperText={helperText}
          disabled={disabled}
          required={required}
          inputRef={inputRef}
          autoComplete="off"
          sx={sx}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <LocationIcon sx={{ color: '#bbb' }} />
              </InputAdornment>
            ),
            endAdornment: isLoading ? (
              <InputAdornment position="end">
                <CircularProgress size={20} />
              </InputAdornment>
            ) : null,
          }}
        />

        {/* Predictions dropdown */}
        <Popper
          open={showDropdown && predictions.length > 0}
          anchorEl={inputRef.current}
          placement="bottom-start"
          style={{ zIndex: 1300, width: inputRef.current?.offsetWidth }}
        >
          <Paper
            elevation={2}
            sx={{
              mt: 0.5,
              maxHeight: 320,
              overflow: 'hidden',
              borderRadius: 1.5,
              border: '1px solid #e8e8e8',
            }}
          >
            <Box sx={{ maxHeight: 260, overflowY: 'auto' }}>
              {predictions.map((prediction, index) => (
                <Box
                  key={prediction.placeId || index}
                  onClick={() => handleSelectPrediction(prediction)}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.5,
                    py: 1.25,
                    px: 2,
                    cursor: 'pointer',
                    transition: 'background-color 0.15s',
                    '&:hover': {
                      backgroundColor: '#f5f5f5',
                    },
                  }}
                >
                  <Box
                    sx={{
                      width: 28,
                      height: 28,
                      borderRadius: '50%',
                      backgroundColor: '#f0f0f0',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <LocationIcon sx={{ color: '#888', fontSize: 16 }} />
                  </Box>
                  <Box sx={{ minWidth: 0, flex: 1 }}>
                    <Typography
                      sx={{
                        fontSize: '0.875rem',
                        fontWeight: 500,
                        color: '#333',
                        lineHeight: 1.4,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {prediction.mainText}
                    </Typography>
                    <Typography
                      sx={{
                        fontSize: '0.75rem',
                        color: '#999',
                        lineHeight: 1.3,
                        mt: 0.25,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {prediction.secondaryText}
                    </Typography>
                  </Box>
                </Box>
              ))}
            </Box>
            {/* Powered by Google */}
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'flex-end',
                alignItems: 'center',
                px: 2,
                py: 0.75,
                borderTop: '1px solid #f0f0f0',
                backgroundColor: '#fafafa',
              }}
            >
              <Typography
                sx={{
                  fontSize: '0.7rem',
                  color: '#999',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.5,
                }}
              >
                powered by
                <Box
                  component="span"
                  sx={{
                    fontWeight: 500,
                    color: '#666',
                    letterSpacing: '-0.02em',
                  }}
                >
                  <Box component="span" sx={{ color: '#4285F4' }}>G</Box>
                  <Box component="span" sx={{ color: '#EA4335' }}>o</Box>
                  <Box component="span" sx={{ color: '#FBBC05' }}>o</Box>
                  <Box component="span" sx={{ color: '#4285F4' }}>g</Box>
                  <Box component="span" sx={{ color: '#34A853' }}>l</Box>
                  <Box component="span" sx={{ color: '#EA4335' }}>e</Box>
                </Box>
              </Typography>
            </Box>
          </Paper>
        </Popper>
      </Box>
    </ClickAwayListener>
  );
};

export default AddressAutocomplete;
