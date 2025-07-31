import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';

const ConfigContext = createContext();

export const ConfigProvider = ({ children, characters }) => {
  const [config, setConfig] = useState({
    avatar: characters[0]?.id || '',
    environment: 'Map_Env_ltOliverDefault_v01',
    camera: { preset: 'Preset1' },
    a2f_config: characters[0]?.a2f_config || {},
    voice_config: characters[0]?.voice_config || {},
    llm_config: characters[0]?.llm_config || {},
  });

  const updateConfig = useCallback(
    (key, value) => {
      if (key === 'avatar') {
        for (const character of characters) {
          if (character.id === value) {
            setConfig((prevConfig) => ({
              ...prevConfig,
              [key]: value,
              a2f_config: character.a2f_config,
              voice_config: character.voice_config,
              llm_config: character.llm_config,
            }));
            break;
          }
        }
      } else {
        if (key.includes('.')) {
          // Handle nested keys (like 'voice_config.voice_id.some_property')
          const keys = key.split('.');
          setConfig((prev) => {
            const newConfig = { ...prev };
            let current = newConfig;

            for (let i = 0; i < keys.length - 1; i++) {
              const currentKey = keys[i];
              if (!current[currentKey]) {
                current[currentKey] = {};
              }
              current = current[currentKey];
            }

            current[keys[keys.length - 1]] = value;
            return newConfig;
          });
        } else {
          // Handle flat keys
          setConfig((prev) => ({ ...prev, [key]: value }));
        }
      }
    },
    [characters]
  );

  const value = useMemo(
    () => ({
      characters,
      config,
      updateConfig,
    }),
    [characters, config, updateConfig]
  );

  return <ConfigContext.Provider value={value}>{children}</ConfigContext.Provider>;
};

export const useConfig = () => {
  const context = useContext(ConfigContext);
  if (!context) {
    throw new Error('useConfig must be used within a ConfigProvider');
  }
  return context;
};
