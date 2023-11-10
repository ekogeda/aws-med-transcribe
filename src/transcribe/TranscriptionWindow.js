import React, { useState, useRef } from 'react';
import uuid from 'uuid';
import SummaryCard from './SummaryCard';
import { streamAudioToWebSocket, closeSocket } from './websocketUtils';
import { detectEntity } from '../comprehend/DetectEntities';
import Transcript, { tokenizeTranscript } from './Transcript';
import { getMicAudioStream } from './audio';
import EntityTable from './EntityTable';
import TranscriptCard from './TranscriptCard';
// import AudioWaveform from './WaveSurfer';
import * as _ from 'lodash';
import audio from '../medasrdemo-Paul.mp4';

const borderStyle = '1px dotted blue';

export const lowConfidenceStyle = {
    'WebkitTextStroke': '1px darkgrey',
    'WebkitTextFillColor': 'skyblue',
};

export const allAnnotationStyle = {
    PROTECTED_HEALTH_INFORMATION: {
        all: {
            background: '#fc7',
            // '-webkit-text-stroke-width': '1px',
            // '-webkit-text-stroke-color': '#fc7',
            // 'text-shadow': '0 1 10px #fc7'
        },
    },
    MEDICAL_CONDITION: {
        all: { background: '#ff9' },
    },
    ANATOMY: {
        all: { textDecoration: 'underline wavy red' },
    },
    MEDICATION: {
        all: { textDecoration: 'underline wavy blue' },
    },
    // "TEST_TREATMENT_PROCEDURE": { 'color': 'blue', 'fontWeight': 'bold' },
    TEST_TREATMENT_PROCEDURE: {
        left: { borderLeft: borderStyle, borderTopLeftRadius: '7px', borderBottomLeftRadius: '7px', padding: '2px' },
        mid: { borderTop: borderStyle, borderBottom: borderStyle, padding: '2px' },
        right: { borderRight: borderStyle, borderTopRightRadius: '7px', borderBottomRightRadius: '7px', padding: '2px' },
        all: { border: borderStyle, borderRadius: '7px', padding: '2px' },
    },
};

export const annotationDisplayName = {
    MEDICAL_CONDITION: 'Medical Condition',
    MEDICATION: 'Medication',
    ANATOMY: 'Anatomy',
    PROTECTED_HEALTH_INFORMATION: 'Protected Health Information (PHI)',
    TEST_TREATMENT_PROCEDURE: 'Tests, Treatments, & Procedures',
    SYSTEM_ORGAN_SITE: 'System/Organ/Site',
    DIRECTION: 'Direction',
    DIAGNOSIS: 'Diagnosis',
    DX_NAME: 'Medical Condition',
    ACUITY: 'Acuity',
    NEGATION: 'Negation',
    SIGN: 'Sign',
    SYMPTOM: 'Symptom',
    BRAND_NAME: 'Brand Name',
    GENERIC_NAME: 'Generic Name',
    DOSAGE: 'Dosage',
    DURATION: 'Duration',
    FORM: 'Form',
    FREQUENCY: 'Frequency',
    RATE: 'Rate',
    ROUTE_OR_MODE: 'Route/Mode',
    STRENGTH: 'Strength',
    PROCEDURE_NAME: 'Procedure Name',
    TEST_NAME: 'Test Name',
    TREATMENT_NAME: 'Treatment Name',
    TEST_VALUE: 'Test Value',
    TEST_UNIT: 'Test Unit',
    ADDRESS: 'Address',
    AGE: 'Age',
    EMAIL: 'Email',
    ID: 'Id',
    NAME: 'Name',
    PHONE_OR_FAX: 'Phone/Fax',
    PROFESSION: 'Profession',
    DATE: 'Date',
};

const TranscriptionWindow = ({ patientId, addNewPatientRecord, discardPatientRecord }) => {
    const [recording, setRecording] = useState(false);
    const [audioSource, setAudioSource] = useState(new Audio(audio));
    // const [transcript, setTranscript] = useState([]);
    // const [transcriptBoxs, setTranscriptBoxs] = useState([]);
    // const [partialTranscript, setPartialTranscript] = useState('');
    // const [entities, setEntities] = useState([]);
    // const [segments, setSegments] = useState([]);
    const [annotations, setAnnotations] = useState([]);
    const [annotationStyles, setAnnotationStyles] = useState({});
    const [showConfidence, setShowConfidence] = useState(false);
    const [showSummary, setShowSummary] = useState(false);
    const [transcriptState, setTranscriptState] = useState({
        transcript: [],
        transcriptBoxs: [],
        segments: [],
        entities: [],
        partialTranscript: '',
    });

    const updateAnnotation = (labels) => {
        setAnnotations(labels);
    };

    const handleAnnotationChange = (category) => {
        const updatedAnnotationStyles = { ...annotationStyles };
        if (updatedAnnotationStyles[category] === undefined) {
            updatedAnnotationStyles[category] = allAnnotationStyle[category];
        } else {
            delete updatedAnnotationStyles[category];
        }
        setAnnotationStyles(updatedAnnotationStyles);
    };

    const toggleConfidence = () => {
        setShowConfidence(!showConfidence);
    };

    const toggleSummary = () => {
        setShowSummary(!showSummary);
    };

    const startRecord = async () => {
        // TODO: clean up transcript and entities
        // setTranscript([]);
        // setTranscriptBoxs([]);
        // setSegments([]);
        // setPartialTranscript('');
        // setEntities([]);
        // setAnnotations([]);
        setAudioSource(new Audio(audio));

        const audioStream = await getMicAudioStream();
        if (audioStream) {
            console.log('Browser supports microphone audio input');
            setRecording(true);

            audioSource.addEventListener('ended', () => {
                stopRecord();
            });

            streamAudioToWebSocket(audioStream, updateTranscript, (error) => {
                console.log(error);
            });
        } else {
            console.log('User\'s browser doesn\'t support audio.');
        }
    };

    const stopRecord = async () => {
        audioSource.pause();
        closeSocket();

        const allTranscript = combineTranscript(transcriptState.transcript);
        const response = await detectEntity(allTranscript);
        setRecording(false);
        setTranscriptState((prevState) => ({
            ...prevState,
            entities: response.Entities,
        }));
        // setEntities(response.Entities);
    };

    const combineTranscript = (transcriptArray) => {
        return transcriptArray.reduce((acc, v) => `${acc}  ${v}`, '');
    };

    // const updateTranscript = async (newTranscript) => {
    //     const { results, text, isPartial } = newTranscript;
    //     let updatedText = text.replace('you was admitted', 'he was admitted');

    //     if (isPartial) {
    //         setPartialTranscript(updatedText);
    //     } else {
    //         const updatedTranscript = [...transcript, updatedText];
    //         setTranscript(updatedTranscript);

    //         const { wordTokens, segmentEntities } = await tokenizeTranscript(updatedText, results);

    //         const segment = {
    //             startTime: results[0].StartTime,
    //             words: wordTokens,
    //         };

    //         setSegments([...segments, segment]);
    //         setTranscriptBoxs(transcriptBoxs);
    //         setTranscript(updatedTranscript);
    //         setPartialTranscript('');
    //         setEntities([...entities, ...segmentEntities]);
    //     }
    // };

    // better

    const updateTranscript = async (newTranscript) => {
        let { results, text, isPartial } = newTranscript;

        /**
         * Temporary Hack for Re:Invent demo
         */
        text = text.replace('you was admitted', 'he was admitted');

        if (isPartial) {
            // Update last chunk of partial transcript
            setTranscriptState((prevState) => ({
                ...prevState,
                partialTranscript: text,
            }));
        } else {
            // Append finalized transcript
            let { transcript, transcriptBoxs, segments, entities } = transcriptState;
            transcript.push(text);

            // Tokenize transcript
            var { wordTokens, segmentEntities } = await tokenizeTranscript(text, results);

            var segment = {
                startTime: results[0].StartTime,
                words: wordTokens,
            };

            segments.push(segment);

            setTranscriptState((prevState) => ({
                ...prevState,
                transcriptBoxs: transcriptBoxs,
                transcript: transcript,
                partialTranscript: '',
                entities: entities.concat(segmentEntities),
                segments,
            }));
        }
    };



    return (
        <div className='m-3'>
            <div className='row d-flex mb-3 pl-3'>
                <button className='btn btn-primary mr-3' onClick={() => (recording ? stopRecord() : startRecord())}>
                    {recording ? 'Stop Dictation' : 'Start Dictation'}
                </button>
                <button className='btn btn-primary' type='button' onClick={toggleSummary}>
                    {showSummary ? 'Hide Summary' : 'Show Summary'}
                </button>
            </div>

            <div className='row pl-3'>
                {/* <AudioWaveform /> */}
                <div className='border col-12 col-md-8' style={{ minHeight: '200px', minHeight: '300px' }}>
                    <div className='row' style={{ backgroundColor: 'lightgrey' }}>
                        <div className='form-check m-3'>
                            <input
                                className='form-check-input'
                                type='checkbox'
                                value=''
                                id={'confidence'}
                                checked={showConfidence}
                                onChange={toggleConfidence}
                            />
                            <label className='form-check-label' htmlFor={'confidence'}>
                                Highlight low confidence terms
                            </label>
                        </div>
                    </div>
                    {_.map(transcriptState.segments, (seg, i) => (
                        <div className='text-left mt-1 mr-n3' style={{ fontWeight: 'normal' }} key={i}>
                            <Transcript
                                startTime={seg.startTime}
                                words={seg.words}
                                updateAnnotation={updateAnnotation}
                                annotationStyle={annotationStyles}
                                showConfidence={showConfidence}
                            ></Transcript>
                        </div>
                    ))}
                    <div className='text-left mt-3 mb-3' style={{ fontWeight: 'bold' }}>
                        {' '}
                        {transcriptState.partialTranscript}
                    </div>
                </div>
                <div className='col-12 col-md-4'>
                    <div className='d-flex flex-column align-items-start mb-3'>
                        {_.map(allAnnotationStyle, (v, k) => (
                            <div className='form-check mt-1' key={k}>
                                <input
                                    className='form-check-input'
                                    type='checkbox'
                                    value=''
                                    id={k}
                                    checked={annotationStyles[k] !== undefined}
                                    onChange={() => handleAnnotationChange(k)}
                                />
                                <label className='form-check-label' htmlFor={k} style={v.all}>
                                    {annotationDisplayName[k]}
                                </label>
                            </div>
                        ))}
                    </div>
                    {annotations.length > 0 && <SummaryCard entities={annotations}></SummaryCard>}
                </div>
            </div>
            <div className='mt-3'>
                {showSummary && (
                    <div id='collapseOne' className='collapse show' aria-labelledby='headingOne' data-parent='#accordionExample'>
                        <div className='card-body mt-n3'>
                            {/* <TranscriptCard transcript={transcriptState.transcript} partialTranscript={transcriptState.partialTranscript} /> */}
                            <EntityTable entities={transcriptState.entities} />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TranscriptionWindow;
