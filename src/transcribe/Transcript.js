import React, { useState, useEffect } from "react";
import { detectEntity } from '../comprehend/DetectEntities';
import * as _ from 'lodash'
import { lowConfidenceStyle } from './TranscriptionWindow';

export const tokenizeTranscript = async (transcipt, results) => {
    let itemList = _.filter(results[0].Alternatives[0].Items, (item, i) => {
        return item.Type === 'pronunciation' // filter out punctuation
    });
    var originalTranscript = "";
    var transcriptWordList = [];

    // tokenize transcript
    let wordList = transcipt.split(" ");
    var runningIndex = 0;

    _.map(wordList, (word, i) => {
        transcriptWordList.push({
            text: word,
            start: runningIndex,
            end: runningIndex + word.length,
            labels: [],
            confidence: itemList[i].Confidence
        });

        originalTranscript = originalTranscript + word + " ";
        runningIndex = runningIndex + word.length + 1;
    });

    // label each token
    let response = await detectEntity(originalTranscript);
    let entities = response['Entities'];

    _.map(transcriptWordList, (word, i) => {
        _.map(entities, (e, i) => {
            if (parseInt(e['BeginOffset']) === parseInt(word.start)
                || parseInt(e['EndOffset']) === parseInt(word.end)
                || parseInt(e['EndOffset']) === (parseInt(word.end) - 1) // remove punctuation
                || (parseInt(e['BeginOffset']) <= parseInt(word.start) && parseInt(e['EndOffset']) >= parseInt(word.end)) // middle tokens
            ) {
                // label this token
                word.labels.push(e)
            }

            // label word if it's an attribute
            _.map(e['Attributes'], (attr, i) => {
                if (parseInt(attr['BeginOffset']) === parseInt(word.start)
                    || parseInt(attr['EndOffset']) === parseInt(word.end)
                    || parseInt(attr['EndOffset']) === (parseInt(word.end) - 1) // remove punctuation
                    || (parseInt(attr['BeginOffset']) <= parseInt(word.start) && parseInt(attr['EndOffset']) >= parseInt(word.end)) // middle tokens
                ) {
                    // label this token
                    word.labels.push(e)
                }
            })
        })
    })


    console.log(JSON.stringify(transcriptWordList));

    return { wordTokens: transcriptWordList, segmentEntities: entities }
}

const Transcript = (props) => {
    const [wordTokenList, setWordTokenList] = useState(props.words);
    const [annotationStyle, setAnnotationStyle] = useState(props.annotationStyle);
    const [showConfidence, setShowConfidence] = useState(props.showConfidence);
    const [startTime] = useState(props.startTime);

    useEffect(() => {
        setWordTokenList(props.words);
        setAnnotationStyle(props.annotationStyle);
        setShowConfidence(props.showConfidence);
    }, [props.words, props.annotationStyle, props.showConfidence]);

    const entityStyle = (token) => {
        let entities = token.labels;
        let style = { color: 'black', 'textDecoration': 'none', 'fontSize': '18px' };
        _.map(entities, (e, i) => {
            _.map(annotationStyle, (v, k) => {
                if (v !== undefined && e['Category'] === k) {
                    if (v['mid']) {
                        style = { ...style, ...v['mid'] };

                        if (e['BeginOffset'] === token.start) {
                            style = { ...style, ...v['left'] };
                        }

                        if (e['EndOffset'] === token.end || e['EndOffset'] === token.end - 1) {
                            style = { ...style, ...v['right'] };
                        }

                        _.map(e['Attributes'], (attr, i) => {
                            if (attr['BeginOffset'] === token.start) {
                                style = { ...style, ...v['left'] };
                            }

                            if (attr['EndOffset'] === token.end || attr['EndOffset'] === token.end - 1) {
                                style = { ...style, ...v['right'] };
                            }
                        });
                    } else {
                        style = { ...style, ...v['all'] };
                    }
                }
            });
        });

        if (showConfidence && token.confidence < 0.9) {
            style = { ...style, ...lowConfidenceStyle };
        }

        return style;
    };

    const isRightMostBorder = (token) => {
        let entities = token.labels;
        let isRightMost = false;
        _.forEach(entities, (e, i) => {
            if (e['Category'] === 'PROTECTED_HEALTH_INFORMATION' || e['Category'] === 'MEDICAL_CONDITION') {
                if (e['EndOffset'] === token.end || e['EndOffset'] === token.end - 1) {
                    isRightMost = true;
                }
            }
        });
        return isRightMost;
    };

    const formatNumber = (n) => {
        if (n < 10) {
            return `0${n}`;
        } else {
            return `${n}`;
        }
    };

    const formatTimestamp = (timestamp) => {
        let time = parseInt(timestamp);
        let hr = Math.floor(time / 3600);
        let min = Math.floor(time / 60);
        let sec = Math.floor(time % 60);
        return `${formatNumber(hr)}:${formatNumber(min)}:${formatNumber(sec)}`;
    };

    return (
        <div className="col mr-n3">
            <div className="row mx-n3">
                <div className="col-1 ml-n3 px-0" style={{ 'paddingTop': '3px', 'fontSize': '18px' }}>
                    {formatTimestamp(startTime)}
                </div>
                <div className="col-11 mr-n3 pr-0 pl-2">
                    <p style={{ 'lineHeight': '20pt' }}>
                        {_.map(wordTokenList, (token, i) => {
                            let display = isRightMostBorder(token) ? token.text : token.text + " ";
                            return (
                                (token.labels.length > 0) ? (
                                    <span key={i++}>
                                        <a
                                            href="#!"
                                            style={entityStyle(token)}
                                            onClick={(e) => {
                                                e.preventDefault();
                                                props.updateAnnotation(token.labels);
                                            }}
                                        >
                                            {display}
                                        </a>
                                        {isRightMostBorder(token) && <span> </span>}
                                    </span>
                                ) : (
                                    <span style={entityStyle(token)} key={i++}>
                                        {display}
                                    </span>
                                )
                            );
                        })}
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Transcript;
