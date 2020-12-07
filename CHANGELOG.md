## 0.3.0

### New features

- __[@tsrt/utils]__ Totally refactored reordering utils. Old utils are now marked as deprecated and will be removed in future.
- __[@tsrt/utils]__ New customizable OrderingService w/ optimized and improved abilities (_maybe will be moved to separate package in future_).
- __[@tsrt/utils]__ OrderingService accepts `GenericOrderingItemType` and options for `primaryKey`, `orderKey`, `allowOrdersOutOfRange`.

- __[@tsrt/sequelize]__ Updated signatures update/onBeforeUpdate/onBeforeCreate/onBeforeBulkCreate methods.
- __[@tsrt/sequelize]__ Added ability for update method to proceed not only w/ primaryKey, but also updateOptions insead. For example for multiple rows updates.
- __[@tsrt/sequelize]__ Finished bulkCreate method to work properly inside transactions.
- __[@tsrt/sequelize]__ Added  `restrictedProperties` configurable and default Repository options.
- __[@tsrt/sequelize]__ Utilizes usage of new customizable OrderingService.
- __[@tsrt/sequelize]__ Refactored Database class. Now it behaves as factory for database connections.
- __[@tsrt/sequelize]__ Wrapped all methods (not only bulk) in transactions.
- __[@tsrt/sequelize]__ Improved types.
- __[@tsrt/sequelize]__ Improved docs.
- __[@tsrt/sequelize]__ Added [tests](https://github.com/tsReusableTools/tsrt/tree/master/packages/sequelize/tests) for Database and BaseRepository.

---

## 0.2.6

### Bugfixes

- __[@tsrt/sequelize]__ Fixed types for `onBeforeRead` hook.
- __[@tsrt/sequelize]__ Fixed readOptions applying order.

---

## 0.2.5

### New features

- __[@tsrt/sequelize]__ Updated signature for read/readOne/readMany methods to provide appropriate ability to use native Sequelize FindOptions.
- __[@tsrt/sequelize]__ Updated signature for delete/softDelete/forceDelete methods to provide ability delete by id or only w/ deleteOptions.

---

## 0.2.4

### New features

- __[@tsrt/application]__ Added docs.

---

## 0.2.2 - 0.2.3

### New features

- __[@tsrt/mparty]__ Improved docs.
- __[@tsrt/mparty-aws]__ Improved docs.
- __[@tsrt/mparty-express]__ Improved docs.
- __[@tsrt/sequelize]__ Updated types for read options.
- __[@tsrt/sequelize]__ Added docs.

---

## 0.2.1

### New features

- __[@tsrt/mparty-aws]__ Added Mparty AWS S3 Adapter and docs.
- __[@tsrt/mparty-express]__ Added Mparty Express middleware and docs.

---

## 0.2.0

### New features

- __[@tsrt/mparty]__ Added framework agnostic package for handling multipart/form-data requests based on busboy
- __[@tsrt/mparty]__ Added default FileSystem Adapter
- __[@tsrt/mparty]__ Added files and fields basic validations

---

## 0.1.2

### New features

- __[@tsrt/web-components]__ Fixed handling for cases where root container is `svg` element itself
- __[@tsrt/web-components]__ Fixed bundles: now there are `umd` and `esm` bundles available

---

## 0.1.1

- Added LICENSE
- Added CHANGELOG.md
- Added .npmignore
- Added `skipLibCheck: true` into base tsconfig.json due to breaking changes of __@types/express-session__ patch release
- Added minimal Readme.md for all packages
- Changed homepage in package.json for each package
- Changed typescript and tslib dependencies to latest stable versions
- Removed `importHelpers` from base tsconfig.json

---


## 0.1.0

- Deployed initial packages

---
