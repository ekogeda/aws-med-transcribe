import React, { useState, useEffect } from 'react';
import * as _ from 'lodash';
import { annotationDisplayName } from './TranscriptionWindow';

const EntityTable = ({ entities }) => {
    const [summary, setSummary] = useState({
        'PROTECTED_HEALTH_INFORMATION': [],
        'MEDICAL_CONDITION': [],
        'MEDICATION': [],
        'ANATOMY': [],
        'TEST_TREATMENT_PROCEDURE': [],
    });

    useEffect(() => {
        const updatedSummary = {
            'PROTECTED_HEALTH_INFORMATION': [],
            'MEDICAL_CONDITION': [],
            'MEDICATION': [],
            'ANATOMY': [],
            'TEST_TREATMENT_PROCEDURE': [],
        };

        _.forEach(entities, (entity) => {
            const entityList = updatedSummary[entity.Category];
            if (entityList !== undefined) {
                entityList.push(entity);
            }
        });

        setSummary(updatedSummary);
    }, [entities]);

    return (
        <div className="mt-3">
            {_.map(summary, (entityList, category) => {
                return (
                    entityList.length > 0 && (
                        <table className="table table-sm" key={category}>
                            <thead className="thead-light">
                                <tr className="row">
                                    <th scope="col" className="col-2 text-left">
                                        {annotationDisplayName[category]}
                                    </th>
                                    <th scope="col" className="col-2">
                                        Type
                                    </th>
                                    <th scope="col" className="col-2">
                                        Confidence
                                    </th>
                                    <th scope="col" className="col-6">
                                        Attributes/Traits
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {_.map(entityList, (entity, i) => {
                                    return (
                                        <tr className="row" key={i}>
                                            <th scope="row" className="col-2 text-left">
                                                {entity['Text']}
                                            </th>
                                            <td className="col-2">{annotationDisplayName[entity['Type']]}</td>
                                            <td className="col-2">{parseFloat(entity['Score']).toPrecision(3)}</td>
                                            <td className="col-6">
                                                {_.map(entity.Attributes, (a, i) => {
                                                    return <span key={i}>{a.Text}; </span>;
                                                })}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    )
                );
            })}
        </div>
    );
};

export default EntityTable;
