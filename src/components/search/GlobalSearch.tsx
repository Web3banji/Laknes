import React from 'react';
import { SearchInput, SearchInputProps } from '../ui/SearchInput';

export type GlobalSearchProps = SearchInputProps;

export function GlobalSearch(props: GlobalSearchProps) {
  return <SearchInput {...props} />;
}
