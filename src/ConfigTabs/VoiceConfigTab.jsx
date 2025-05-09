import React, { useState, useEffect } from 'react';
import { Form, Button, Tabs, Tab, Accordion } from 'react-bootstrap';


const styles = {
    settingsCard: {
      border: 'none',
      borderRadius: '8px',
    },
    settingGroup: {
      marginBottom: '20px',
    },
    sliderContainer: {
      padding: '0 10px',
    },
    controlRow: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '10px',
      fontSize: '12px',
      color: '#6c757d',
    },
    voiceSelector: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '10px',
      backgroundColor: '#f8f9fa',
      borderRadius: '8px',
      marginBottom: '10px',
    },
    rightSidebar: {
      position: 'fixed',
      top: 0,
      right: 0,
      width: '480px',
      height: '100vh',
      backgroundColor: '#ffffff',
      borderLeft: '1px solid #e9ecef',
      padding: '20px',
      overflowY: 'auto',
      zIndex: 900
    },
    mainContent: {
  
      // width:  '100%',
      paddingRight: '480px',
  
    }
  };

const VoiceConfigTab = () => {

    return (
        <>
            <div style={styles.settingGroup}>
                <h6>Voice</h6>
                <div style={styles.voiceSelector}>
                    <div className="d-flex align-items-center">
                        <div className="rounded-circle bg-warning me-2" style={{ width: '20px', height: '20px' }}></div>
                        <span>Isaac Voice Test 002</span>
                    </div>
                    <span>›</span>
                </div>
            </div>

            <div style={styles.settingGroup}>
                <h6>Model</h6>
                <div style={styles.voiceSelector}>
                    <div className="d-flex align-items-center">
                        <span>Eleven Multilingual v2</span>
                    </div>
                    <span>›</span>
                </div>
            </div>

            <div style={styles.settingGroup}>
                <h6>Speed</h6>
                <div style={styles.sliderContainer}>
                    <div style={styles.controlRow}>
                        <span>Slower</span>
                        <span>Faster</span>
                    </div>
                    <Form.Range />
                </div>
            </div>

            <div style={styles.settingGroup}>
                <h6>Stability</h6>
                <div style={styles.sliderContainer}>
                    <div style={styles.controlRow}>
                        <span>More variable</span>
                        <span>More stable</span>
                    </div>
                    <Form.Range />
                </div>
            </div>

            <div style={styles.settingGroup}>
                <h6>Similarity</h6>
                <div style={styles.sliderContainer}>
                    <div style={styles.controlRow}>
                        <span>Low</span>
                        <span>High</span>
                    </div>
                    <Form.Range defaultValue={100} />
                </div>
            </div>

            <div style={styles.settingGroup}>
                <h6>Style Exaggeration</h6>
                <div style={styles.sliderContainer}>
                    <div style={styles.controlRow}>
                        <span>None</span>
                        <span>Exaggerated</span>
                    </div>
                    <Form.Range defaultValue={0} />
                </div>
            </div>

            <div className="d-flex justify-content-between mt-4">
                <Form.Check
                    type="switch"
                    id="speaker-boost-switch"
                    label="Speaker boost"
                />
                <Button variant="link" className="text-secondary p-0">Reset values</Button>
            </div>
        </>
    );

};

export default VoiceConfigTab;