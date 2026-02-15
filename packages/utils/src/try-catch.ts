type Success<T> = {
  d: T;
  e: null;
};

type Failure<E> = {
  d: null;
  e: E;
};

type Result<T, E = Error> = Success<T> | Failure<E>;

/**
 * Mapped Error
 */
class OrmError extends Error {
  cause: {
    message: string;
  } = { message: '' };

  constructor() {
    super();
  }
}

// Main wrapper function
export async function tryCatch<T, E = Error>(promise: Promise<T>): Promise<Result<T, E>> {
  try {
    const data = await promise;
    return { d: data, e: null };
  } catch (unknownError) {
    const asOrmError = unknownError as OrmError;

    // Wraps backend drizzle orm error
    if (asOrmError?.cause?.message) {
      asOrmError.message = asOrmError.cause.message + ' ' + asOrmError.message;
    }
    return { d: null, e: unknownError as E };
  }
}
