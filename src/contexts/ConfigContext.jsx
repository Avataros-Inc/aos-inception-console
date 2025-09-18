import React, { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react';
import { getEnvironments } from '../postgrestAPI';

const ConfigContext = createContext();

export const ConfigProvider = ({ children, characters }) => {
  const [config, setConfig] = useState({
    avatar: characters[0]?.id || '',
    environment: 'Map_Env_ltOliverDefault_v01', // Will be updated to UUID once environments load
    camera: { preset: 'Preset1', resolution: '1920x1080' },
    a2f_config: characters[0]?.a2f_config || {},
    voice_config: characters[0]?.voice_config || {},
    llm_config: characters[0]?.llm_config || {},
  });

  // Load environments and set default environment UUID
  useEffect(() => {
    const initializeDefaultEnvironment = async () => {
      try {
        const environments = await getEnvironments();
        if (environments && environments.length > 0) {
          // Try to find the default environment by name/path
          const defaultEnv = environments.find(
            (env) =>
              env.name === 'Map_Env_ltOliverDefault_v01' ||
              env.path === 'Map_Env_ltOliverDefault_v01' ||
              env.id === 'Map_Env_ltOliverDefault_v01'
          );

          // Use the found environment or fall back to the first one
          const selectedEnv = defaultEnv || environments[0];

          setConfig((prev) => ({
            ...prev,
            environment: selectedEnv.id, // Use the UUID
          }));
        }
      } catch (error) {
        console.error('Failed to initialize default environment:', error);
        // Keep the string value as fallback - createLivestream will handle the lookup
      }
    };

    initializeDefaultEnvironment();
  }, []);

  // Function to apply avatar session configuration
  const applyAvatarSession = useCallback((sessionAvatar) => {
    if (sessionAvatar) {
      console.log('Updating config for active session avatar:', sessionAvatar.name);

      setConfig((prevConfig) => ({
        ...prevConfig,
        avatar: sessionAvatar.id,
        a2f_config: sessionAvatar.a2f_config || {},
        voice_config: sessionAvatar.voice_config || {},
        llm_config: sessionAvatar.llm_config || {},
        unreal_config: sessionAvatar.unreal_config || {},
        // Keep existing environment and camera settings unless specified in avatar
      }));
    }
  }, []);

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
      applyAvatarSession,
    }),
    [characters, config, updateConfig, applyAvatarSession]
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
