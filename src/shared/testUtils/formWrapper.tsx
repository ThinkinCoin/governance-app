import type { ReactNode } from 'react';
import { FormProvider, useForm } from 'react-hook-form';

import enTranslations from '@/assets/locales/en.json';
import { TranslationsProvider } from '@/shared/components/translationsProvider';

export interface IFormWrapperProps {
    /**
     * Children of the component.
     */
    children?: ReactNode;
}

export const FormWrapper: React.FC<IFormWrapperProps> = (props) => {
    const { children } = props;

    const formMethods = useForm();

    return (
        <TranslationsProvider translations={enTranslations}>
            <FormProvider {...formMethods}>{children}</FormProvider>
        </TranslationsProvider>
    );
};
