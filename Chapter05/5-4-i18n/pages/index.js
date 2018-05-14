import React from 'react';
import Link from 'next/link';
import Common from '../components/Common';
import Other from '../components/Other';
import withI18n from '../lib/withI18n';

const setLocale = (lang) => {
    document.cookie = 'lang=' + lang + '; path=/';
    window.location.reload();
};

const getStyle = (current, lang) => ({fontWeight: current === lang ? 'bold' : 'normal'});

const Index = ({t, lng, moment, msg}) => (
    <div>
        <div>Page-level common: {t('common:HELLO')}</div>
        <Common/>
        <Other/>
        <div>{moment.format('LLLL')}</div>
        <div>{msg(t('common:MESSAGES'), {count: 0})}</div>
        <div>{msg(t('common:MESSAGES'), {count: 1})}</div>
        <div>{msg(t('common:MESSAGES'), {count: 2})}</div>
        <Link href='/other'>
            <button>{t('common:OTHER_PAGE')}</button>
        </Link>
        <hr/>
        <button onClick={() => setLocale('en')} style={getStyle(lng, 'en')}>EN</button>
        <button onClick={() => setLocale('es')} style={getStyle(lng, 'es')}>ES</button>
        <button onClick={() => setLocale('de')} style={getStyle(lng, 'de')}>DE</button>
    </div>
);

export default withI18n()(Index);