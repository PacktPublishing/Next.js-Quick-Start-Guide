import React from "react";
import {translate} from 'react-i18next'

const Common = ({t}) => (
    <div>Component common: {t('HELLO')}}</div>
);

export default translate()(Common);