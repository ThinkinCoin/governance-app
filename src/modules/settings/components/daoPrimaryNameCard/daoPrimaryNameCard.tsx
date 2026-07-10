'use client';

import { useState, useEffect } from 'react';
import { Button, InputText, AlertCard, type IAlertCardProps } from '@aragon/gov-ui-kit';
import { useSetPrimaryName } from '@/shared/hooks/useSetPrimaryName';
import { useTranslations } from '@/shared/components/translationsProvider';
import type { IDao } from '@/shared/api/daoService';

export interface IDaoPrimaryNameCardProps {
    dao: IDao;
    onSuccess?: () => void;
}

export const DaoPrimaryNameCard: React.FC<IDaoPrimaryNameCardProps> = (props) => {
    const { dao, onSuccess } = props;
    const { t } = useTranslations();
    const { mutate: setPrimaryName, isPending, isError, error } = useSetPrimaryName();

    const [primaryName, setPrimaryNameValue] = useState(dao.primaryName ?? '');
    const [alert, setAlert] = useState<{ message: string; variant: IAlertCardProps['variant'] } | null>(null);

    useEffect(() => {
        if (alert) {
            const timer = setTimeout(() => setAlert(null), 5000);
            return () => clearTimeout(timer);
        }
    }, [alert]);

    const handleSubmit = () => {
        if (!primaryName || !primaryName.endsWith('.country')) {
            setAlert({
                message: t('app.settings.daoSettings.primaryName.invalidFormat'),
                variant: 'critical',
            });
            return;
        }

        setPrimaryName(
            { address: dao.address, network: dao.network, primaryName },
            {
                onSuccess: () => {
                    setAlert({
                        message: t('app.settings.daoSettings.primaryName.success'),
                        variant: 'success',
                    });
                    onSuccess?.();
                },
                onError: () => {
                    setAlert({
                        message: t('app.settings.daoSettings.primaryName.error'),
                        variant: 'critical',
                    });
                },
            },
        );
    };

    const handleClear = () => {
        setPrimaryName(
            { address: dao.address, network: dao.network, primaryName: null },
            {
                onSuccess: () => {
                    setPrimaryNameValue('');
                    setAlert({
                        message: t('app.settings.daoSettings.primaryName.cleared'),
                        variant: 'success',
                    });
                    onSuccess?.();
                },
                onError: () => {
                    setAlert({
                        message: t('app.settings.daoSettings.primaryName.clearError'),
                        variant: 'critical',
                    });
                },
            },
        );
    };

    return (
        <div className="flex w-full flex-col gap-6 rounded-xl border border-neutral-200 bg-neutral-0 p-6 shadow-neutral-md">
            <div className="flex flex-col gap-2">
                <h2 className="text-lg font-semibold text-neutral-800">
                    {t('app.settings.daoSettings.primaryName.title')}
                </h2>
                <p className="text-sm text-neutral-500">{t('app.settings.daoSettings.primaryName.description')}</p>
            </div>

            {alert && (
                <AlertCard message={alert.message} variant={alert.variant} />
            )}

            <InputText
                label={t('app.settings.daoSettings.primaryName.label')}
                placeholder={t('app.settings.daoSettings.primaryName.placeholder')}
                value={primaryName}
                onChange={(e) => setPrimaryNameValue(e.target.value)}
                helpText={t('app.settings.daoSettings.primaryName.helpText')}
            />

            <div className="flex gap-3">
                <Button
                    size="md"
                    variant="primary"
                    onClick={handleSubmit}
                    isLoading={isPending}
                    disabled={!primaryName || primaryName === dao.primaryName}
                >
                    {t('app.settings.daoSettings.primaryName.submit')}
                </Button>
                {dao.primaryName && (
                    <Button
                        size="md"
                        variant="tertiary"
                        onClick={handleClear}
                        isLoading={isPending}
                    >
                        {t('app.settings.daoSettings.primaryName.clear')}
                    </Button>
                )}
            </div>

            {isError && error && (
                <p className="text-sm text-critical-800">
                    {t('app.settings.daoSettings.primaryName.validationError')}: {error.message}
                </p>
            )}
        </div>
    );
};
