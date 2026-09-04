import React from 'react';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Modal from '../Modal';
import Pagination from '../Pagination';
import Search from '../Search';

describe('UI interactions', () => {
  it('closes a modal through its close button, backdrop, and Escape key', async () => {
    const user = userEvent.setup();
    const onClose = jest.fn();
    const { rerender } = render(
      <Modal isOpen onClose={onClose} title="Confirm action">
        <p>Modal content</p>
      </Modal>,
    );

    await user.click(screen.getByRole('button'));
    expect(onClose).toHaveBeenCalledTimes(1);

    await user.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalledTimes(2);

    rerender(
      <Modal isOpen onClose={onClose} title="Confirm action">
        <p>Modal content</p>
      </Modal>,
    );
    await user.click(screen.getByText('Modal content').parentElement!.parentElement!);
    expect(onClose).toHaveBeenCalledTimes(3);
  });

  it('debounces search input and changes only available pages', async () => {
    jest.useFakeTimers();
    const onSearch = jest.fn();
    const onPageChange = jest.fn();
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    render(
      <>
        <Search aria-label="Search" debounce={250} onSearch={onSearch} />
        <Pagination page={2} totalPages={3} onPageChange={onPageChange} />
      </>,
    );

    expect(screen.getByRole('textbox', { name: 'Search' })).toHaveAttribute('autocomplete', 'off');

    await user.type(screen.getByRole('textbox', { name: 'Search' }), 'invoice');
    act(() => jest.advanceTimersByTime(250));
    expect(onSearch).toHaveBeenLastCalledWith('invoice');

    const paginationButtons = screen
      .getAllByRole('button')
      .filter((button) => button.getAttribute('aria-label') !== 'Clear search');
    await user.click(paginationButtons[0]);
    await user.click(paginationButtons[2]);
    await user.click(paginationButtons[3]);
    expect(onPageChange).toHaveBeenNthCalledWith(1, 1);
    expect(onPageChange).toHaveBeenNthCalledWith(2, 3);
    expect(onPageChange).toHaveBeenNthCalledWith(3, 3);
    jest.useRealTimers();
  });
});
