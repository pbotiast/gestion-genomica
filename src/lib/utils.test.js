import { describe, it, expect } from 'vitest';
import { cn } from './utils';

describe('cn utility', () => {
    it('combines class names correctly', () => {
        const result = cn('class1', 'class2');
        expect(result).toBe('class1 class2');
    });

    it('merges tailwind classes correctly', () => {
        const result = cn('p-4', 'p-2');
        expect(result).toBe('p-2');
    });

    it('handles conditional classes', () => {
        const result = cn('class1', true && 'class2', false && 'class3');
        expect(result).toBe('class1 class2');
    });
});
