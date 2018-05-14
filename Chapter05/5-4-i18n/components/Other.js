import React from 'react';
import {translate} from 'react-i18next';

const Other = ({t}) => (
    <div>
        Component other: {t('other:GOOD_MORNING')}
        {(t('other:GOOD_MORNING') === 'GOOD_MORNING') ? (
            <span style={{color: 'red'}}>&nbsp;it's not translated because "Index" page was opened directly and it does not have "other" namespace explicitly requested</span>
        ) : (
            <span style={{color: 'green'}}>&nbsp;it is translated because "Other" page has requested "other" namespace and now it is cached (even on Index page)</span>
        )}
    </div>
);

export default translate(['other'])(Other);