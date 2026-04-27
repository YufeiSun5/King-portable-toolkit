// 文件说明：按钮组件，统一工具栏按钮和图标按钮的基础样式。
// 联动 layouts、pages、features 和全局样式。

import type { ButtonHTMLAttributes, ReactNode } from 'react';

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  icon?: ReactNode;
  iconOnly?: boolean;
};

export function Button({ icon, iconOnly, children, className = '', ...props }: ButtonProps) {
  return (
    <button className={`btn ${iconOnly ? 'btn-icon' : ''} ${className}`} {...props}>
      {icon}
      {!iconOnly && children}
    </button>
  );
}

