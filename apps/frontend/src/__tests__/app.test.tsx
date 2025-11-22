import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import App from '../App';

describe('App Component', () => {
    it('renders loading state initially', () => {
        render(<App />);
        // Since isLoading is true by default in the store, it should show the spinner
        const spinner = document.querySelector('.animate-spin');
        expect(spinner).toBeInTheDocument();
    });
});
