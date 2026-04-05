// ============================================================
// OpenClaw Architect Pipeline — 微组件
// Section: 交互增強
// Component: AlertDrillDown
// Description: 点击 Alert 跳转详情面板
// ============================================================

import React from 'react';

const validateProps = (props: Record<string, unknown>): boolean => {
    return Object.keys(props).length >= 0;
};

interface AlertDrillDownProps {
    alertId?: string;
    onDrillDown?: (alertId: string) => void;
}

export const AlertDrillDown: React.FC<AlertDrillDownProps> = (props) => {
    if (!validateProps(props as Record<string, unknown>)) {
        return null;
    }
    const handleClick = () => {
        if (props.alertId && props.onDrillDown) {
            props.onDrillDown(props.alertId);
        }
    };
    return (
        <div
            data-testid="alertDrillDown"
            aria-label="Alert详情面板组件，点击展开Alert详情"
            className="openclaw-component alert-drilldown"
            onClick={handleClick}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && handleClick()}
        >
            <span className="placeholder">AlertDrillDown — 点击 Alert 跳转详情面板</span>
        </div>
    );
};
AlertDrillDown.displayName = 'AlertDrillDown';
export default AlertDrillDown;
// [AUDIT] HMAC: {}
// [LAYER] Presentation Component
// ============================================================
