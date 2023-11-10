import React, { useState, useEffect } from 'react';
import * as _ from 'lodash';

const TranscriptCard = ({ transcript, partialTranscript }) => {
    const [transcriptState, setTranscriptState] = useState(transcript);
    const [partialTranscriptState, setPartialTranscriptState] = useState(partialTranscript);

    useEffect(() => {
        setTranscriptState(transcript);
        setPartialTranscriptState(partialTranscript);
    }, [transcript, partialTranscript]);

    return (
        <div className="border rounded" style={{ minHeight: '200px', minWidth: '300px' }}>
            {_.map(transcriptState, (content, i) => (
                <div className="text-left mt-3 mb-3 ml-3 mr-3" style={{ fontWeight: 'normal' }} key={i}>
                    {content}
                </div>
            ))}
            <div className="text-left mt-3 mb-3 mx-3" style={{ fontWeight: 'bold' }}>
                {partialTranscriptState}
            </div>
        </div>
    );
};

export default TranscriptCard;
