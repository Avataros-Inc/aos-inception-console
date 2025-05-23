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

const VoiceConfigTab = ({ characters, updateConfig, config }) => {
    // const [model, setModel] = useState(config.voice_config.model_id);
    // const [voice, setVoice] = useState('Isaac Voice Test 002');

    const aosKokoVoices = [
        'af_heart', 'af_alloy', 'af_aoede', 'af_bella', 'af_jessica',
        'af_kore', 'af_nicole', 'af_nova', 'af_river', 'af_sarah',
        'af_sky', 'am_adam', 'am_echo', 'am_eric', 'am_fenrir',
        'am_liam', 'am_michael', 'am_onyx', 'am_puck', 'am_santa',
        'bf_alice', 'bf_emma', 'bf_isabella', 'bf_lily', 'bm_daniel',
        'bm_fable', 'bm_george', 'bm_lewis'
    ];

    return (
        <>

            <div style={styles.settingGroup}>
                <h6>Model</h6>
                <Form.Select
                    value={config.voice_config.model_id}
                    // onChange={(e) => setModel(e.target.value)}
                    onChange={(e) => updateConfig("voice_config.model_id", e.target.value)}
                    style={styles.voiceSelector}
                >
                    <option value="koko1">AOS Koko1</option>
                    <option value="eleven_multilingual_v2">Eleven Multilingual v2</option>
                </Form.Select>
            </div>

            <div style={styles.settingGroup}>
                <h6>Voice</h6>
                {config.voice_config.model_id === 'koko1' ? (
                    <Form.Select
                        value={config.voice_config.voice_id}
                        // onChange={(e) => setVoice(e.target.value)}
                        onChange={(e) => updateConfig("voice_config.voice_id", e.target.value)}
                        style={styles.voiceSelector}
                    >
                        {aosKokoVoices.map(v => (
                            <option key={v} value={v}>{v}</option>
                        ))}
                    </Form.Select>
                ) : (
                    <div style={styles.voiceSelector}>
                        <div className="d-flex align-items-center">
                            <div className="rounded-circle bg-warning me-2" style={{ width: '20px', height: '20px' }}></div>
                            <span>{config.voice_config.voice_id}</span>
                        </div>
                        <span>›</span>
                    </div>
                )}
            </div>

            {config.voice_config.model_id === 'koko1' ? (
                <div style={styles.settingGroup}>
                    <h6>Speed</h6>
                    <div style={styles.sliderContainer}>
                        <div style={styles.controlRow}>
                            <span>Slower</span>
                            <span>Faster</span>
                        </div>
                        <Form.Range
                            min={-3.0}
                            max={3.0}
                            step={0.1}
                            value={config.voice_config.voice_settings.speed}
                            onChange={(e) => updateConfig("voice_config.voice_settings.speed", e.target.value)}
                        />
                    </div>
                </div>
            ) : (
                <>
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
            )}
        </>
    );
};

const VoiceConfigTabOld = () => {

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