import AsyncStorage from '@react-native-async-storage/async-storage';
import { createRoundStore } from './roundStore';

// Readers and the tracker share the same write queue.
export const roundLibraryStore = createRoundStore(AsyncStorage);
