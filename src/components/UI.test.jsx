import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { KPICard, Badge, Card } from './UI';
import { FileText } from 'lucide-react';

describe('UI Components', () => {
    describe('KPICard', () => {
        it('renders with basic props', () => {
            render(
                <KPICard
                    title="Total Requests"
                    value={150}
                    color="indigo"
                />
            );

            expect(screen.getByText('Total Requests')).toBeInTheDocument();
            expect(screen.getByText('150')).toBeInTheDocument();
        });

        it('displays trend information when provided', () => {
            render(
                <KPICard
                    title="Revenue"
                    value="€1,234"
                    trend="up"
                    trendValue="+12.5%"
                    color="green"
                />
            );

            expect(screen.getByText('+12.5%')).toBeInTheDocument();
            expect(screen.getByText(/vs mes anterior/i)).toBeInTheDocument();
        });

        it('renders with icon when provided', () => {
            const { container } = render(
                <KPICard
                    title="Documents"
                    value={42}
                    icon={FileText}
                    color="cyan"
                />
            );

            // Check if icon is rendered
            const icon = container.querySelector('svg');
            expect(icon).toBeInTheDocument();
        });

        it('applies correct color scheme', () => {
            const { container } = render(
                <KPICard
                    title="Test"
                    value={100}
                    color="purple"
                />
            );

            const valueElement = screen.getByText('100');
            expect(valueElement).toHaveClass('text-purple-700');
        });

        it('handles different trend directions', () => {
            const { rerender } = render(
                <KPICard
                    title="Metric"
                    value={50}
                    trend="up"
                    trendValue="+5%"
                />
            );

            expect(screen.getByText('↗ +5%')).toBeInTheDocument();

            rerender(
                <KPICard
                    title="Metric"
                    value={50}
                    trend="down"
                    trendValue="-3%"
                />
            );

            expect(screen.getByText('↘ -3%')).toBeInTheDocument();
        });
    });

    describe('Badge', () => {
        it('renders with text content', () => {
            render(<Badge>Active</Badge>);

            expect(screen.getByText('Active')).toBeInTheDocument();
        });

        it('applies variant styles correctly', () => {
            const { rerender, container } = render(<Badge variant="success">Success</Badge>);

            let badge = screen.getByText('Success');
            expect(badge).toHaveClass('badge-success');

            rerender(<Badge variant="danger">Error</Badge>);
            badge = screen.getByText('Error');
            expect(badge).toHaveClass('badge-danger');

            rerender(<Badge variant="info">Info</Badge>);
            badge = screen.getByText('Info');
            expect(badge).toHaveClass('badge-info');
        });

        it('uses primary variant by default', () => {
            render(<Badge>Default</Badge>);

            const badge = screen.getByText('Default');
            expect(badge).toHaveClass('badge-primary');
        });
    });

    describe('Card', () => {
        it('renders children correctly', () => {
            render(
                <Card>
                    <h2>Card Title</h2>
                    <p>Card content</p>
                </Card>
            );

            expect(screen.getByText('Card Title')).toBeInTheDocument();
            expect(screen.getByText('Card content')).toBeInTheDocument();
        });

        it('applies custom className', () => {
            const { container } = render(
                <Card className="custom-class">
                    <p>Content</p>
                </Card>
            );

            const card = container.firstChild;
            expect(card).toHaveClass('custom-class');
            expect(card).toHaveClass('glass-panel');
        });

        it('applies hover effect by default', () => {
            const { container } = render(
                <Card>
                    <p>Content</p>
                </Card>
            );

            const card = container.firstChild;
            expect(card).toHaveClass('card');
        });

        it('can disable hover effect', () => {
            const { container } = render(
                <Card hover={false}>
                    <p>Content</p>
                </Card>
            );

            const card = container.firstChild;
            expect(card).not.toHaveClass('card');
        });

        it('passes through HTML attributes', () => {
            const handleClick = vi.fn();

            render(
                <Card onClick={handleClick} data-testid="test-card">
                    <p>Content</p>
                </Card>
            );

            const card = screen.getByTestId('test-card');
            fireEvent.click(card);

            expect(handleClick).toHaveBeenCalled();
        });
    });
});
