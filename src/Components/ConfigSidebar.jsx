import React, { useState, useEffect, useMemo } from 'react';
import { useConfig } from '../contexts/ConfigContext';
import A2FConfigTab from '../ConfigTabs/A2FConfigTab';
import VisualConfigTab from '../ConfigTabs/VisualConfigTab';
import VoiceConfigTab from '../ConfigTabs/VoiceConfigTab';
import LLMConfigTab from '../ConfigTabs/LLMConfigTab';
import LiveControlsTab from '../ConfigTabs/LiveControlsTab';
import { Button } from '@/Components/Button';

const ConfigSidebar = ({
  visual = false,
  voice = false,
  a2f = false,
  llm = false,
  sendMessage = null,
  isLiveSession = false,
}) => {
  const { characters, config, updateConfig } = useConfig();
  const [activeTab, setActiveTab] = useState('visual');

  // Build tab configuration based on boolean props and session state
  const tabConfig = useMemo(() => {
    const tabs = [];

    if (!isLiveSession) {
      if (visual) tabs.push({ key: 'visual', label: 'Visual', component: VisualConfigTab });
      if (voice) tabs.push({ key: 'voice', label: 'Voice', component: VoiceConfigTab });
      if (a2f) tabs.push({ key: 'a2f', label: 'Config', component: A2FConfigTab });
      if (llm) tabs.push({ key: 'llm', label: 'LLM Config', component: LLMConfigTab });
    }

    return tabs;
  }, [visual, voice, a2f, llm, isLiveSession]);

  // Ensure the default tab is valid for the current page
  useEffect(() => {
    if (tabConfig.length > 0 && !tabConfig.find((tab) => tab.key === activeTab)) {
      setActiveTab(tabConfig[0].key);
    }
  }, [tabConfig, activeTab]);

  // Reset to first tab when switching between live and non-live sessions
  useEffect(() => {
    if (tabConfig.length > 0) {
      setActiveTab(tabConfig[0].key);
    }
  }, [isLiveSession, tabConfig]);

  // Find the active tab component
  const activeTabConfig = tabConfig.find((tab) => tab.key === activeTab);
  const ActiveTabComponent = activeTabConfig?.component;

  if (tabConfig.length === 0) {
    return null;
  }

  return (
    <div className="fixed top-0 right-0 w-[480px] h-screen sidebar-glass-right border-l border-border-subtle p-5 overflow-y-auto z-[900] transform transition-transform duration-500 ease-in-out translate-x-0 before:ml-[480px]">
      {/* Tab Navigation */}
      <div className="border-b border-border-subtle mb-5">
        <div className="flex gap-2 pb-3">
          {tabConfig.map((tab) => (
            <Button
              key={tab.key}
              variant={activeTab === tab.key ? 'primary' : 'secondary'}
              onClick={() => setActiveTab(tab.key)}
              type="button"
            >
              {tab.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="min-h-[400px]">
        {ActiveTabComponent && (
          <ActiveTabComponent
            characters={characters}
            updateConfig={updateConfig}
            config={config}
            sendMessage={sendMessage}
          />
        )}
      </div>
    </div>
  );
};

export default ConfigSidebar;
