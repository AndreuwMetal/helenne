import type { AnchorHTMLAttributes, ButtonHTMLAttributes } from 'react'
import { Link, type LinkProps } from 'react-router'
import styles from './Button.module.css'

type Variant = 'solid' | 'outline' | 'text'

const classes = (variant: Variant, extra?: string) => [styles.button, styles[variant], extra].filter(Boolean).join(' ')

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }

export function Button({ variant = 'solid', className, type = 'button', ...rest }: ButtonProps) {
  return <button type={type} className={classes(variant, className)} {...rest} />
}

type ButtonLinkProps = LinkProps & { variant?: Variant }

/** Enlace interno con aspecto de botón. */
export function ButtonLink({ variant = 'solid', className, ...rest }: ButtonLinkProps) {
  return <Link className={classes(variant, className)} {...rest} />
}

type ExternalProps = AnchorHTMLAttributes<HTMLAnchorElement> & { variant?: Variant }

/** Enlace externo (WhatsApp) con aspecto de botón; abre en otra pestaña. */
export function ButtonExternal({ variant = 'solid', className, ...rest }: ExternalProps) {
  return <a target="_blank" rel="noopener noreferrer" className={classes(variant, className)} {...rest} />
}
