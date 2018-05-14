import React from 'react';
import Link from 'next/link';
import Common from '../components/Common';
import Other from '../components/Other';
import withI18n from '../lib/withI18n';

const OtherPage = ({t}) => (
    <div>
        <div>Page-level other: {t('other:GOOD_MORNING')}</div>
        <Common/>
        <Other/>
        <Link href='/'>
            <button>{t('common:BACK')}</button>
        </Link>
    </div>

);

export default withI18n(['other'])(OtherPage);