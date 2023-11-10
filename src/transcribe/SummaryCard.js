import React, { useState, useEffect } from 'react';
import { annotationDisplayName } from './TranscriptionWindow';
import * as _ from 'lodash';

const SummaryCard = ({ entities }) => {
    const [summary, setSummary] = useState({});

    useEffect(() => {
        setSummary(getSummaryFromEntityList(entities));
    }, [entities]);

    const getSummaryFromEntityList = (entities) => {
        let summary = {
            'PROTECTED_HEALTH_INFORMATION': [],
            'ANATOMY': [],
            'MEDICAL_CONDITION': [],
            'MEDICATION': [],
            'TEST_TREATMENT_PROCEDURE': [],
        };

        _.forEach(entities, (entity, i) => {
            let entityList = summary[entity.Category]
            if (entityList !== undefined) {
                entityList.push(entity)
            }
        });

        return summary;
    }

    const flattenEntity = (entities) => {
        let text = "";
        _.map(entities, (e, i) => {
            text = text + " " + e.Text;

            _.map(e.Attributes, (a, j) => {
                text = text + " " + a.Text;
            });
        });

        return text;
    }

    return (
        <div>
            <div className="border">
                <div style={{ 'backgroundColor': 'lightgrey', 'fontWeight': 'bold', 'textAlign': 'left' }}>
                    <label className="my-3" style={{ 'paddingLeft': '4px' }}>
                        Entity Detail
                    </label>
                </div>
                <ul className="ml-n3" style={{ 'listStyle': 'square inside', 'paddingLeft': '20px' }}>
                    {_.map(entities, (entity, i) => (
                        <li className="text-left mt-1" key={i}>
                            <span style={{ 'fontWeight': 'bold', 'textAlign': 'left' }}>{entity.Text}</span>
                            <ul>
                                <li className="text-left">
                                    ({entity.Score.toPrecision(3)}) {annotationDisplayName[entity.Category]}
                                    {annotationDisplayName[entity.Type] && ` - ${annotationDisplayName[entity.Type]}`}
                                    {_.map(entity.Traits, (trait, j) => ` - (${trait['Score'].toPrecision(3)}) ${annotationDisplayName[trait['Name']]}`)}
                                </li>
                            </ul>
                        </li>
                    ))}
                    {_.map(entities, (entity, i) => (
                        _.map(entity.Attributes, (a, j) => (
                            <li className="text-left mt-1" key={j}>
                                <span style={{ 'fontWeight': 'bold', 'textAlign': 'left' }}>{a.Text}</span>
                                <ul>
                                    <li className="text-left">
                                        ({a.Score.toPrecision(3)}) {annotationDisplayName[entity.Category]}
                                        {annotationDisplayName[a.Type] && ` - ${annotationDisplayName[a.Type]}`}
                                        {_.map(a.Traits, (trait, k) => ` - ${annotationDisplayName[trait['Name']]}`)}
                                    </li>
                                </ul>
                            </li>
                        ))
                    ))}
                </ul>
            </div>
        </div>
    );
}

export default SummaryCard;
