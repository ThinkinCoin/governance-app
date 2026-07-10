import { useTranslations } from '@/shared/components/translationsProvider';
import { Heading, invariant } from '@aragon/gov-ui-kit';
import classNames from 'classnames';

export interface ITransactionInfo {
    /**
     * Current title of the stepper.
     */
    title: string;
    /**
     * Optional details displayed below the title.
     */
    details?: string;
    /**
     * Current phase of the stepper based on the active dialog.
     */
    current?: number;
    /**
     * Total number of phases in the dialog flow.
     */
    total?: number;
}

export interface ITransactionStatusInfoProps extends ITransactionInfo {
    /**
     * Additional class names to be applied to the component.
     */
    className?: string;
}

export const TransactionStatusInfo: React.FC<ITransactionStatusInfoProps> = (props) => {
    const { title, details, current, total, className } = props;

    invariant((current == null) === (total == null), 'TransactionStatusInfo: current and total must be set together');

    const { t } = useTranslations();

    const isMultiphase = current != null && total != null;

    return (
        <div className={classNames('flex flex-col gap-1', className)}>
            <div className="flex items-center justify-between">
                <Heading size="h4" className="truncate">
                    {title}
                </Heading>
                {isMultiphase && (
                    <div className="flex flex-row gap-1 text-sm leading-tight font-normal text-neutral-800 md:text-base">
                        <span>{t('app.shared.transactionStatus.info.current', { current })}</span>
                        <span className="text-neutral-500">{t('app.shared.transactionStatus.info.total', { total })}</span>
                    </div>
                )}
            </div>
            {details && <span className="text-xs text-neutral-600 md:text-sm">{details}</span>}
        </div>
    );
};
